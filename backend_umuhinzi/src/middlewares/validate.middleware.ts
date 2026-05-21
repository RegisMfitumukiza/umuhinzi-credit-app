import { z } from "zod";
import { Request, Response, NextFunction } from "express";
import { APIError } from "../utils/ApiError.js";

export const validate =
  (schema: z.ZodType) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query
    });

    if (!result.success) {
      const message = result.error.issues
        .map((issue) => issue.message)
        .join(", ");

      return next(new APIError(message, 400));
    }

    next();
  };