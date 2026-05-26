import { Request, Response, NextFunction } from "express";
import { APIError } from "../utils/ApiError.js";
import { Prisma } from "../generated/prisma/client.js";
import { logger } from "../utils/logger.js";

export const globalErrorHandler = (
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = 500;
  let message = "Internal Server Error";

  logger.error("An error occurred:", {
    path: req.originalUrl,
    method: req.method,
    message: error instanceof Error ? error.message : "Unknown error",
    stack: error instanceof Error ? error.stack : undefined
  })

  if (error instanceof APIError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message
    });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002":
        statusCode = 409;
        message = "Duplicate value already exists";
        break;

      case "P2025":
        statusCode = 404;
        message = "Record not found";
        break;

      case "P2003":
        statusCode = 400;
        message = "Invalid related record";
        break;

      default:
        statusCode = 400;
        message = "Database error";
    }

    res.status(statusCode).json({
      success: false,
      message
    });
    return;
  }

  if (error instanceof Error) {
    message = error.message;
  }

  res.status(statusCode).json({
    success: false,
    message
  });
};