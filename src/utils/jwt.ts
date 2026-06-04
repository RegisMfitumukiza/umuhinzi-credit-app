import jwt, { SignOptions } from "jsonwebtoken";
import { Role } from "../generated/prisma/client.js";

type TokenPayload = {
  userId: string;
  role: Role;
};

export const generateToken = (payload: TokenPayload): string => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is missing");
  }

  const expiresIn: SignOptions["expiresIn"] =
    (process.env.JWT_EXPIRES_IN as SignOptions["expiresIn"]) || "1d";

  return jwt.sign(payload, secret, { expiresIn });
};