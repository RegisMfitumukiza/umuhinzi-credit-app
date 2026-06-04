import morgan from "morgan";

export const requestLogger =
  process.env.NODE_ENV === "production"
    ? morgan("combined", {
        skip: (req) => req.url === "/health"
      })
    : morgan("dev", {
        skip: (req) => req.url === "/health"
      });