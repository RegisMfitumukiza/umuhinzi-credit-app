import type { Response } from "express";

type ApiMeta = {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
};

export const sendResponse = <T>(
  res: Response,
  statusCode: number,
  message: string,
  data: T,
  meta?: ApiMeta
): Response => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    ...(meta ? { meta } : {}),
  });
};

export const sendCreated = <T>(
  res: Response,
  message: string,
  data: T
): Response => sendResponse(res, 201, message, data);