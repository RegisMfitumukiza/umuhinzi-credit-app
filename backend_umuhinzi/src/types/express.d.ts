import type { Role } from "../generated/prisma/client.js";

declare global {
  namespace Express {
    interface User {
      userId: string;
      farmerId?: string;
      role: Role;
      email?: string;
    }

    interface Request {
      user?: User;
    }
  }
}

export {};