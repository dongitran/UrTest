"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { useRouter } from "next/navigation";
import {
  initKeycloak,
  login as keycloakLogin,
  logout as keycloakLogout,
  isAuthenticated,
  getToken,
  getUserInfo,
  setToken,
  updateToken,
  isTokenExpired,
} from "@/lib/keycloak";

const TOKEN_REFRESH_SAFETY_MARGIN = 60;
const TOKEN_REFRESH_MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY = 1000;

function parseJwt(token) {
  try {
    if (!token) return null;

    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("Error parsing JWT:", e);
    return null;
  }
}

function getEnhancedUserInfo() {
  const userInfo = getUserInfo();
  if (!userInfo) return null;

  try {
    const keycloakToken = localStorage.getItem("keycloak_token");
    if (keycloakToken) {
      const tokenObj = JSON.parse(keycloakToken);
      const decoded = parseJwt(tokenObj.access_token);

      const systemRoles = [
        "offline_access",
        "uma_authorization",
        "default-roles-urtest",
      ];

      const allRoles = decoded?.realm_access?.roles || [];
      const filteredRoles = allRoles.filter(
        (role) => !systemRoles.includes(role)
      );

      return {
        ...userInfo,
        roles: filteredRoles,
        tokenExp: decoded?.exp,
      };
    }
  } catch (error) {
    console.error("Error extracting roles from token:", error);
  }

  return userInfo;
}

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [keycloak, setKeycloak] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const router = useRouter();

  const refreshTimeoutRef = useRef(null);
  const userRef = useRef(null);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const handleLogout = useCallback(async () => {
    try {
      setLoading(true);

      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }

      await directLogout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshTokenIfNeeded = useCallback(async () => {
    try {
      const currentUser = userRef.current;
      if (!currentUser?.tokenExp) return;

      const currentTime = Math.floor(Date.now() / 1000);
      const timeToExpiry = currentUser.tokenExp - currentTime;

      if (timeToExpiry <= TOKEN_REFRESH_SAFETY_MARGIN) {
        console.log("Token expiring soon, refreshing...");
        const refreshed = await updateToken(
          0,
          TOKEN_REFRESH_MAX_RETRIES,
          INITIAL_RETRY_DELAY
        );

        if (!refreshed && isTokenExpired()) {
          console.warn("Token refresh failed");
          await handleLogout();
        } else if (refreshed) {
          const userInfo = getEnhancedUserInfo();
          setUser(userInfo);
        }
      }
    } catch (error) {
      console.error("Error refreshing token:", error);
      if (
        error.name !== "TypeError" ||
        (!error.message.includes("Failed to fetch") &&
          !error.message.includes("NetworkError") &&
          !error.message.includes("Network request failed"))
      ) {
        await handleLogout();
      }
    }
  }, [handleLogout]);

  useEffect(() => {
    if (!isAuthenticated() || !user) return;

    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    const checkInterval = 2 * 60 * 1000;

    refreshTokenIfNeeded();

    const intervalId = setInterval(refreshTokenIfNeeded, checkInterval);

    return () => {
      clearInterval(intervalId);
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [user, refreshTokenIfNeeded]);

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      if (typeof window !== "undefined") {
        try {
          const keycloakInstance = initKeycloak();

          if (isMounted) {
            setKeycloak(keycloakInstance);

            if (isAuthenticated()) {
              const userInfo = getEnhancedUserInfo();
              setUser(userInfo);
            }

            setLoading(false);
            setInitialized(true);
          }
        } catch (error) {
          console.error("Keycloak initialization error:", error);
          if (isMounted) {
            setLoading(false);
            setInitialized(true);
          }
        }
      }
    };

    initAuth();

    return () => {
      isMounted = false;
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
    };
  }, []);

  const directLogin = async (username, password) => {
    try {
      setLoading(true);

      const formData = new URLSearchParams();
      formData.append("grant_type", "password");
      formData.append("client_id", process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID);
      formData.append("username", username);
      formData.append("password", password);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_KEYCLOAK_URL}/realms/${process.env.NEXT_PUBLIC_KEYCLOAK_REALM}/protocol/openid-connect/token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Login failed:", errorData);
        return {
          success: false,
          error: errorData.error_description || "Login failed",
        };
      }

      const tokenResponse = await response.json();

      setToken(tokenResponse);

      const userInfo = getEnhancedUserInfo();
      setUser(userInfo);

      router.push("/dashboard");

      return { success: true };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: error.message || "Unknown error" };
    } finally {
      setLoading(false);
    }
  };

  const directLogout = async () => {
    try {
      setLoading(true);

      const tokenInfo = localStorage.getItem("keycloak_token")
        ? JSON.parse(localStorage.getItem("keycloak_token"))
        : null;

      const refreshToken = tokenInfo?.refresh_token;

      if (refreshToken) {
        try {
          console.log("Calling Keycloak logout API...");

          const formData = new URLSearchParams();
          formData.append(
            "client_id",
            process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID
          );
          formData.append("refresh_token", refreshToken);

          const response = await fetch(
            `${process.env.NEXT_PUBLIC_KEYCLOAK_URL}/realms/${process.env.NEXT_PUBLIC_KEYCLOAK_REALM}/protocol/openid-connect/logout`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: formData,
            }
          );

          if (!response.ok) {
            const errorText = await response.text();
            console.error(
              "Keycloak logout API failed:",
              response.status,
              errorText
            );
          } else {
            console.log("Keycloak logout API successful");
          }
        } catch (e) {
          console.error("Error calling logout API:", e);
        }
      } else {
        console.warn("Refresh token not found for logout");
      }

      localStorage.removeItem("code_verifier");
      localStorage.removeItem("oauth_state");
      localStorage.removeItem("keycloak_token");

      const clearCookie = (name, options = {}) => {
        const { domain, path = "/" } = options;
        let cookieString = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path};`;

        if (domain) {
          cookieString += ` domain=${domain};`;
        }

        document.cookie = cookieString;
      };

      clearCookie("KEYCLOAK_SESSION");
      clearCookie("KEYCLOAK_IDENTITY");
      clearCookie("KEYCLOAK_REMEMBER_ME");

      try {
        const keycloakUrl = new URL(process.env.NEXT_PUBLIC_KEYCLOAK_URL);
        const keycloakDomain = keycloakUrl.hostname;

        const rootDomain = keycloakDomain.split(".").slice(-2).join(".");

        clearCookie("KEYCLOAK_SESSION", { domain: keycloakDomain });
        clearCookie("KEYCLOAK_IDENTITY", { domain: keycloakDomain });
        clearCookie("KEYCLOAK_REMEMBER_ME", { domain: keycloakDomain });

        clearCookie("KEYCLOAK_SESSION", { domain: rootDomain });
        clearCookie("KEYCLOAK_IDENTITY", { domain: rootDomain });
        clearCookie("KEYCLOAK_REMEMBER_ME", { domain: rootDomain });
      } catch (e) {
        console.error("Error clearing domain cookies:", e);
      }

      setUser(null);
      if (keycloak) {
        keycloak.authenticated = false;
        keycloak.token = null;
        keycloak.refreshToken = null;
        keycloak.idToken = null;
        keycloak.tokenParsed = null;
        keycloak.refreshTokenParsed = null;
        keycloak.idTokenParsed = null;
      }

      window.location.href = "/login";

      return true;
    } catch (error) {
      console.error("Logout error:", error);
      setUser(null);
      window.location.href = window.location.origin;
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      setLoading(true);
      console.log("Starting login process...");
      const authenticated = await keycloakLogin();

      console.log("Authentication status:", authenticated);

      if (authenticated) {
        const userInfo = getEnhancedUserInfo();
        setUser(userInfo);
        console.log("Login successful:", userInfo);
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  const setTokenManually = (tokenResponse) => {
    setToken(tokenResponse);
    const userInfo = getEnhancedUserInfo();
    setUser(userInfo);
  };

  const value = {
    user,
    loading,
    initialized,
    login: handleLogin,
    logout: handleLogout,
    directLogin,
    directLogout,
    isAuthenticated,
    getToken,
    keycloak,
    setTokenManually,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
