import { z } from "zod";
import { Request, Response, NextFunction } from "express";
import { APIError } from "../utils/ApiError.js";

export const validate =
  (schema: z.ZodType) =>
  (req: Request, res: Response, next: NextFunction): void => {
    // First try to validate the request body directly (flat schema).
    let result = schema.safeParse(req.body);
    // If that fails, fall back to the historic wrapper that validates body, params and query.
    if (!result.success) {
      result = schema.safeParse({
        body: req.body,
        params: req.params,
        query: req.query,
      });
    }

    if (!result.success) {
      const message = result.error.issues
        .map((issue) => issue.message)
        .join(", ");
      return next(new APIError(message, 400));
    }

    // Attach the validated data to request for downstream usage (optional).
    // @ts-ignore – we augment the request object.
    req.validated = result.data;
    next();
  };