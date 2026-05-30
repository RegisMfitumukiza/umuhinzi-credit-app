import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("umuhinzi_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = localStorage.getItem("umuhinzi_refresh_token");
      if (refreshToken) {
        try {
          const { data } = await axios.post(
            `${import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1"}/auth/refresh-token`,
            { refreshToken }
          );
          const newToken = data.data.accessToken;
          const newRefreshToken = data.data.refreshToken;
          if (newRefreshToken) {
            localStorage.setItem("umuhinzi_refresh_token", newRefreshToken);
          }
          localStorage.setItem("umuhinzi_token", newToken);
          original.headers.Authorization = `Bearer ${newToken}`;
          return api(original);
        } catch {
          localStorage.removeItem("umuhinzi_token");
          localStorage.removeItem("umuhinzi_refresh_token");
          localStorage.removeItem("umuhinzi_user");
          window.location.href = "/login";
        }
      } else {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);
