import { Request, Response, NextFunction } from "express";
import { APIError } from "../utils/ApiError.js";

export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  next(
    new APIError(
      `Cannot find route ${req.originalUrl} on this server`,
      404
    )
  );
};