import type { Role, UserStatus } from "../generated/prisma/client.js";

declare global {
  namespace Express {
    interface AuthUser {
      id: string;
      fullName: string;
      email: string;
      role: Role;
      status: UserStatus;
      isEmailVerified: boolean;
    }

    interface Request {
      user?: AuthUser;
    }
  }
}

export {};