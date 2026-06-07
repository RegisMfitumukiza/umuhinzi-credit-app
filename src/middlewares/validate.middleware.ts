import { z } from "zod";
import { Request, Response, NextFunction } from "express";
import { APIError } from "../utils/ApiError.js";

export const validate =
  (schema: z.ZodType) =>
  (req: Request, res: Response, next: NextFunction): void => {
    // First try to validate the request body directly (flat schema).
    let result = schema.safeParse(req.body);
    let usedWrapper = false;

    // If that fails, fall back to the historic wrapper that validates body, params and query.
    if (!result.success) {
      result = schema.safeParse({
        body: req.body,
        params: req.params,
        query: req.query,
      });
      usedWrapper = true;
    }

    if (!result.success) {
      const message = result.error.issues
        .map((issue) => issue.message)
        .join(", ");
      return next(new APIError(message, 400));
    }

    // Replace req.body with the coerced/parsed values so controllers receive
    // proper types (e.g. Date objects instead of raw date strings).
    const parsed = result.data as Record<string, unknown>;
    if (usedWrapper && parsed.body !== undefined) {
      req.body = parsed.body;
    } else if (!usedWrapper) {
      req.body = parsed;
    }

    // @ts-ignore – we augment the request object.
    req.validated = result.data;
    next();
  };