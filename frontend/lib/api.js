import axios from "axios";
import { getToken, updateToken, logout } from "./keycloak";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

apiClient.interceptors.request.use(
  async (config) => {
    try {
      const tokenUpdated = await updateToken(60);

      if (!tokenUpdated) {
        await logout();
        return Promise.reject(new Error("Token refresh failed"));
      }
    } catch (error) {
      console.error("Token update error:", error);
      await logout();
      return Promise.reject(error);
    }

    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 ||
      (error.response?.data?.error === "invalid_grant" && !originalRequest._retry)
    ) {
      originalRequest._retry = true;

      try {
        await logout();
      } catch (logoutError) {
        console.error("Automatic logout failed:", logoutError);
      }
    }

    return Promise.reject(error);
  }
);

export const TestResourceApi = (path = "/api/test-resource") => {
  const list = async (params = {}) => {
    const res = await apiClient.get(path, { params });
    return res.data;
  };
  const create = async (data) => {
    const res = await apiClient.post(path, data);
    return res;
  };
  const _delete = async (id) => {
    const res = await apiClient.delete(`${path}/${id}`);
    return res;
  };
  const patch = async (id, data) => {
    const res = await apiClient.patch(`${path}/${id}`, data);
    return res;
  };
  const get = async (id) => {
    const res = await apiClient.get(`${path}/${id}`);
    return res.data;
  };
  return { patch, create, list, delete: _delete, get };
};

export const TestSuiteApi = (path = "/api/testsuite") => {
  const draftExecute = async (data) => {
    const res = await apiClient.post(`${path}/draft-execute`, data);
    return res.data;
  };
  const retrySync = async (id) => {
    const res = await apiClient.post(`${path}/${id}/retry-sync`);
    return res;
  };
  const post = async (data) => {
    const res = await apiClient.post(path, data);
    return res;
  };
  const detail = async (id) => {
    const res = await apiClient.get(`${path}/${id}`);
    return res.data;
  };
  const patch = async (id, data) => {
    const res = await apiClient.patch(`${path}/${id}`, data);
    return res;
  };
  const _delete = async (id) => {
    const res = await apiClient.delete(`${path}/${id}`);
    return res;
  };
  const execute = async (id, data) => {
    const res = await apiClient.post(`${path}/${id}/execute`, data);
    return res;
  };
  const executeAll = async (data) => {
    const res = await apiClient.post(`${path}/execute/all`, data);
    return res;
  };
  return { retrySync, executeAll, draftExecute, post, patch, detail, execute, delete: _delete };
};

export const ProjectApi = (path = "/api/project") => {
  const _delete = async (id) => {
    const res = await apiClient.delete(`${path}/${id}`);
    return res;
  };

  const get = async () => {
    const res = await apiClient.get(`${path}`);
    return res.data;
  };
  const detail = async (id) => {
    const res = await apiClient.get(`${path}/${id}`);
    return res.data;
  };
  const patch = async (id, data) => {
    const res = await apiClient.patch(`${path}/${id}`, data);
    return res;
  };
  return { patch, detail, delete: _delete, get };
};
export const DashboardApi = (path = "/api/dashboard") => {
  const get = async (params) => {
    const res = await apiClient.get(path, {
      params,
    });
    return res.data;
  };
  return { get };
};

export default apiClient;
