import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

import { APIError } from "../utils/ApiError.js";
import { Role, UserStatus } from "../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";

type AuthPayload = {
  userId: string;
  role: Role;
};

type RoleValue = Role | readonly Role[];

const normalizeRoles = (roles: RoleValue): Role[] =>
  Array.isArray(roles) ? [...roles] : [roles];

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
        status: true,
        farmerProfile: {
          select: {
            id: true
          }
        }
      }
    });

    if (!user) {
      return next(new APIError("User not found", 404));
    }

    if (user.status !== UserStatus.ACTIVE) {
      return next(new APIError("Your account is not active", 403));
    }

    req.user = {
      userId: user.id,
      role: user.role,
      farmerId: user.farmerProfile?.id
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

export const authorizeRoles = (allowedRoles: RoleValue) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new APIError("Unauthorized", 401));
    }

    const roles = normalizeRoles(allowedRoles);

    if (!roles.includes(req.user.role)) {
      return next(new APIError("Access denied", 403));
    }

    next();
  };

export const requireAdmin = (
  req: Request,
  _res: Response,
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