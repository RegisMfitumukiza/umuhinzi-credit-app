import { z } from "zod";
import { Request, Response, NextFunction } from "express";
import { APIError } from "../utils/ApiError.js";

export const validate =
  (schema: z.ZodType) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!result.success) {
      const message = result.error.issues.map((issue) => issue.message).join(", ");

      return next(new APIError(message, 400));
    }

    // Replace request payloads with the parsed (and coerced) values so
    // downstream handlers receive the correct types (e.g. Date objects
    // produced by z.coerce.date()).
    const parsed = result.data as { body?: any; params?: any; query?: any };

    if (parsed.body) req.body = parsed.body;
    if (parsed.params) req.params = parsed.params;
    if (parsed.query) req.query = parsed.query;

    next();
  };