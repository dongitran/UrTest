import axios from "axios";
import { getToken, updateToken, logout, isTokenExpired } from "./keycloak";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

apiClient.interceptors.request.use(
  async (config) => {
    try {
      const tokenUpdated = await updateToken(60, 3, 1000);

      if (!tokenUpdated) {
        if (isTokenExpired()) {
          await logout();
          return Promise.reject(new Error("Token expired and refresh failed"));
        }
      }
    } catch (error) {
      console.error("Token update error:", error);
      if (
        error.name !== "TypeError" ||
        (!error.message.includes("Failed to fetch") &&
          !error.message.includes("NetworkError") &&
          !error.message.includes("Network request failed"))
      ) {
        await logout();
        return Promise.reject(error);
      }
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
      (error.response?.data?.error === "invalid_grant" &&
        !originalRequest._retry)
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
  const _delete = async (id, params = {}) => {
    const res = await apiClient.delete(`${path}/${id}`, params);
    return res;
  };
  const patch = async (id, data) => {
    const res = await apiClient.patch(`${path}/${id}`, data);
    return res;
  };
  const get = async (id, params = {}) => {
    const res = await apiClient.get(`${path}/${id}`, params);
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
  const detail = async (id, params = {}) => {
    const res = await apiClient.get(`${path}/${id}`, { params });
    return res.data;
  };
  const patch = async (id, data) => {
    const res = await apiClient.patch(`${path}/${id}`, data);
    return res;
  };
  const _delete = async (id, params = {}) => {
    const res = await apiClient.delete(`${path}/${id}`, { params });
    return res;
  };
  const execute = async (id, data, params = {}) => {
    const res = await apiClient.post(`${path}/${id}/execute`, data, { params });
    return res;
  };
  const executeAll = async (data) => {
    const res = await apiClient.post(`${path}/execute/all`, data);
    return res;
  };
  return {
    retrySync,
    executeAll,
    draftExecute,
    post,
    patch,
    detail,
    execute,
    delete: _delete,
  };
};

export const ManualTestApi = (path = "/api/manual-test") => {
  const getStats = async (projectId) => {
    const res = await apiClient.get(`${path}/stats`, { params: { projectId } });
    return res.data;
  };

  const getTestCases = async (projectId, params = {}) => {
    const res = await apiClient.get(`${path}/test-cases`, {
      params: { projectId, ...params },
    });
    return res.data;
  };

  const getTestCase = async (id) => {
    const res = await apiClient.get(`${path}/test-cases/${id}`);
    return res.data;
  };

  const createTestCase = async (data) => {
    const res = await apiClient.post(`${path}/test-cases`, data);
    return res.data;
  };

  const updateTestCase = async (id, data) => {
    const res = await apiClient.patch(`${path}/test-cases/${id}`, data);
    return res.data;
  };

  const deleteTestCase = async (id) => {
    const res = await apiClient.delete(`${path}/test-cases/${id}`);
    return res.data;
  };

  const executeTestCase = async (id, data) => {
    const res = await apiClient.post(`${path}/test-cases/${id}/execute`, data);
    return res.data;
  };

  const updateTestCaseStatus = async (id, status, notes = "") => {
    const res = await apiClient.patch(`${path}/test-cases/${id}/status`, {
      status,
      notes,
    });
    return res.data;
  };

  const createBugForTestCase = async (testCaseId, data) => {
    const res = await apiClient.post(
      `${path}/test-cases/${testCaseId}/bugs`,
      data
    );
    return res.data;
  };

  const getBugsForTestCase = async (testCaseId) => {
    const res = await apiClient.get(`${path}/test-cases/${testCaseId}/bugs`);
    return res.data;
  };

  return {
    getStats,
    getTestCases,
    getTestCase,
    createTestCase,
    updateTestCase,
    deleteTestCase,
    executeTestCase,
    updateTestCaseStatus,
    createBugForTestCase,
    getBugsForTestCase,
  };
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
  const getAssignments = async (projectId) => {
    const res = await apiClient.get(`${path}/${projectId}/assignments`);
    return res.data;
  };
  const addAssignment = async (projectId, userEmail) => {
    const res = await apiClient.post(`${path}/${projectId}/assignments`, {
      userEmail,
    });
    return res.data;
  };
  const removeAssignment = async (projectId, userEmail) => {
    const res = await apiClient.delete(
      `${path}/${projectId}/assignments/${userEmail}`
    );
    return res.data;
  };
  const getAvailableStaff = async (projectId) => {
    const res = await apiClient.get(`${path}/${projectId}/available-staff`);
    return res.data;
  };
  return {
    patch,
    detail,
    delete: _delete,
    get,
    getAssignments,
    addAssignment,
    removeAssignment,
    getAvailableStaff,
  };
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
