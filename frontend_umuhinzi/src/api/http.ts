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

// Map backend messages to friendly ones
const friendlyMessage = (raw: string, status: number): string => {
  const msg = (raw || "").toLowerCase();

  // Auth errors
  if (msg.includes("invalid email or password")) return "Incorrect email or password. Please try again.";
  if (msg.includes("account is not active")) return "Your account is not active. Contact the administrator.";
  if (msg.includes("token") && msg.includes("expired")) return "Your session has expired. Please log in again.";
  if (msg.includes("not authenticated") || msg.includes("unauthorized")) return "You need to log in to continue.";

  // Duplicate / conflict
  if (msg.includes("email") && (msg.includes("already") || msg.includes("exists"))) return "This email address is already registered.";
  if (msg.includes("phone") && (msg.includes("already") || msg.includes("exists"))) return "This phone number is already registered.";
  if (msg.includes("duplicate") || msg.includes("already exists")) return "This record already exists. Please check your input.";
  if (msg.includes("registration number")) return "This registration number is already in use.";

  // Validation errors
  if (msg.includes("farmer profile") && msg.includes("create")) return "Please complete your farmer profile before applying for a loan.";
  if (msg.includes("farmer profile not found")) return "Farmer profile not found. Please create your profile first.";
  if (msg.includes("institution not found")) return "The selected institution was not found.";
  if (msg.includes("not active") && msg.includes("institution")) return "This institution is not active yet and cannot accept applications.";
  if (msg.includes("loan is not active")) return "This loan is not active. You can only make payments on active loans.";
  if (msg.includes("loan is not in approved")) return "This loan must be approved before it can be disbursed.";
  if (msg.includes("schedule already paid")) return "This installment has already been paid.";
  if (msg.includes("duplicate transaction")) return "A payment with this transaction reference already exists.";
  if (msg.includes("invalid status transition")) return "This status change is not allowed for the current application state.";
  if (msg.includes("can only delete pending")) return "Only pending applications can be deleted.";
  if (msg.includes("already an active member")) return "This farmer is already a member of a cooperative.";

  // Permission errors
  if (status === 403) return "You do not have permission to perform this action.";

  // Not found
  if (status === 404 && msg.includes("route")) return "This feature is not available. Please restart the server.";
  if (status === 404) return raw || "The requested record was not found.";

  // Conflict
  if (status === 409) return raw || "This record already exists.";

  // Validation (400)
  if (status === 400) return raw || "Please check your input and try again.";

  // Rate limit
  if (status === 429) return "Too many attempts. Please wait a moment and try again.";

  // Server error
  if (status >= 500) return "A server error occurred. Please try again later.";

  return raw || "Something went wrong. Please try again.";
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status ?? 0;
      const rawMessage = error.response?.data?.message || error.message || "";
      const message = friendlyMessage(rawMessage, status);

      // Replace the error message so all .catch(e => e.message) get the friendly version
      const enhanced = new Error(message) as Error & { status: number; originalMessage: string };
      enhanced.status = status;
      enhanced.originalMessage = rawMessage;
      return Promise.reject(enhanced);
    }
    return Promise.reject(error);
  }
);
