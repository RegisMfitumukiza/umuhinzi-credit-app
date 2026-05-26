import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { prisma } from "../lib/prisma.js";
import { APIError } from "../utils/ApiError.js";
import { authUserSelect } from "../utils/selects/user.select.js";
import type { Role } from "../generated/prisma/client.js";

type JwtPayload = {
  id: string;
};

const getTokenFromHeader = (authHeader?: string): string => {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new APIError("No token provided", 401);
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    throw new APIError("Invalid authorization format", 401);
  }

  return token;
};

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = getTokenFromHeader(req.headers.authorization);

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new APIError("JWT_SECRET is missing", 500);
    }

    const decoded = jwt.verify(token, secret) as JwtPayload;

    if (!decoded.id) {
      throw new APIError("Invalid token payload", 401);
    }

    const user = await prisma.user.findUnique({
      where: {
        id: decoded.id,
      },
      select: authUserSelect,
    });

    if (!user) {
      throw new APIError("User not found", 401);
    }

    if (user.status !== "ACTIVE") {
      throw new APIError("Account is not active", 403);
    }

    req.user = user;

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return next(new APIError("Token expired", 401));
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return next(new APIError("Invalid token", 401));
    }

    next(error);
  }
};

export const authorizeRoles = (...roles: Role[]) => {
  return (
    req: Request,
    _res: Response,
    next: NextFunction
  ): void => {
    if (!req.user) {
      return next(new APIError("User not authenticated", 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new APIError("You are not allowed to access this resource", 403)
      );
    }

    next();
  };
};

/* ================= ROLE SHORTCUTS ================= */

export const requireAdmin = authorizeRoles("ADMIN");

export const requireFarmer = authorizeRoles("FARMER");

export const requireInstitution = authorizeRoles("INSTITUTION");

export const requireCooperativeManager = authorizeRoles("COOPERATIVE_MANAGER");

export const requireGovernmentPartner = authorizeRoles("GOVERNMENT_PARTNER");

export const requireAdminOrGovernmentPartner = authorizeRoles(
  "ADMIN",
  "GOVERNMENT_PARTNER"
);

export const requireAdminOrInstitution = authorizeRoles(
  "ADMIN",
  "INSTITUTION"
);

export const requireFarmerOrCooperativeManager = authorizeRoles(
  "FARMER",
  "COOPERATIVE_MANAGER"
);