import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.DEV
    ? "/api"
    : (import.meta.env.VITE_API_BASE_URL || "/api"),
});

axiosInstance.interceptors.request.use(
  (config) => {

    const token = localStorage.getItem("token");

    if (token) {

      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },

  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(

  (response) => response,

  (error) => {

    if (error.response?.status === 401) {

      const requestUrl = error.config?.url || "";

      if (requestUrl.includes("/auth/login") || requestUrl.includes("/auth/register")) {
        return Promise.reject(error);
      }

      localStorage.removeItem("token");

      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;