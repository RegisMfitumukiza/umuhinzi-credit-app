import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

import { APIError } from "../utils/ApiError.js";
import { Role } from "../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";

type AuthPayload = {
  userId: string;
  role: Role;
};

// declare global {
//   namespace Express {
//     interface Request {
//       user?: AuthPayload;
//     }
//   }
// }

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new APIError("No token provided", 401));
  }

  const token = authHeader.split(" ")[1];

  try {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      return next(new APIError("JWT_SECRET is missing", 500));
    }

    const decoded = jwt.verify(token, secret) as AuthPayload;

    const user = await prisma.user.findUnique({
      where: {
        id: decoded.userId
      },
      select: {
        id: true,
        role: true,
        isBanned: true
      }
    });

    if (!user) {
      return next(new APIError("User not found", 404));
    }

    if (user.isBanned) {
      return next(new APIError("Your account has been banned", 403));
    }

    req.user = {
      userId: user.id,
      role: user.role
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return next(new APIError("Token expired", 401));
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return next(new APIError("Invalid token", 401));
    }

    return next(new APIError("Authentication failed", 401));
  }
};

export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    return next(new APIError("Unauthorized", 401));
  }

  if (req.user.role !== Role.ADMIN) {
    return next(new APIError("Access denied: admins only", 403));
  }

  next();
};

export const requireHost = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    return next(new APIError("Unauthorized", 401));
  }

  if (req.user.role !== Role.HOST && req.user.role !== Role.ADMIN) {
    return next(new APIError("Access denied: hosts only", 403));
  }

  next();
};

export const requireGuest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    return next(new APIError("Unauthorized", 401));
  }

  if (req.user.role !== Role.GUEST && req.user.role !== Role.ADMIN) {
    return next(new APIError("Access denied: guests only", 403));
  }

  next();
};