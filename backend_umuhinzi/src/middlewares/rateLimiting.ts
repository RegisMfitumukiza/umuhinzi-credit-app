import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import type { Request } from "express";

/* ─── Helper: IPv6-safe IP key ─── */
const safeIpKey = (req: Request): string =>
  ipKeyGenerator(req.ip ?? "unknown");

/* ─── Global IP-based limiter (applied to all /api/v1 routes) ─── */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests from this IP. Please try again later.",
  },
});

/* ─── Auth limiter (login, register, forgot-password) ─── */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 5 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication attempts. Please try again later.",
  },
  skipSuccessfulRequests: false,
});

/* ─── Per-user limiter (keyed by authenticated user ID) ─── */
export const perUserLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 300,            // allow normal dashboard fan-out and farmer actions
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request): string => {
    // Use authenticated user ID if available, fall back to IPv6-safe IP
    const userId = (req.user as { id?: string } | undefined)?.id;
    return userId ?? safeIpKey(req);
  },
  message: {
    success: false,
    message: "You are sending too many requests. Please slow down.",
  },
  skip: (req: Request): boolean => {
    // Only apply to authenticated requests
    return !(req.user as { id?: string } | undefined)?.id;
  },
});

/* ─── Sensitive action limiter (loan applications, credit score generation) ─── */
export const sensitiveActionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request): string => {
    const userId = (req.user as { id?: string } | undefined)?.id;
    return userId ?? safeIpKey(req);
  },
  message: {
    success: false,
    message: "Too many requests for this action. Please try again later.",
  },
});
