import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("umuhinzi_token");

  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) return Promise.reject(error);

    const originalRequest = error.config as typeof error.config & { _retry?: boolean };
    const isUnauthorized = error.response?.status === 401;
    const alreadyRetried = originalRequest?._retry;
    const refreshToken = localStorage.getItem("umuhinzi_refresh_token");

    if (isUnauthorized && !alreadyRetried && refreshToken && originalRequest) {
      originalRequest._retry = true;

      try {
        const response = await axios.post<{ data: { accessToken: string } }>(
          `${import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1"}/auth/refresh-token`,
          { refreshToken }
        );

        const newToken = response.data.data.accessToken;
        localStorage.setItem("umuhinzi_token", newToken);
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        return api(originalRequest);
      } catch {
        localStorage.removeItem("umuhinzi_token");
        localStorage.removeItem("umuhinzi_refresh_token");
        localStorage.removeItem("umuhinzi_user");
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);
