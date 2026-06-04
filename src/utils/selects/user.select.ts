import type { Prisma } from "../../generated/prisma/client.js";

export const safeUserSelect = {
    id: true,
    fullName: true,
    email: true,
    phone: true,
    role: true,
    status: true,
    isEmailVerified: true,
    isPhoneVerified: true,
    profileImageUrl: true,
    profileImagePublicId: true,
    province: true,
    district: true,
    sector: true,
    cell: true,
    village: true,
    lastLoginAt: true,
    passwordChangedAt: true,
    createdAt: true,
    updatedAt: true,
} satisfies Prisma.UserSelect


export const authUserSelect = {
    id: true,
    fullName: true,
    email: true,
    role: true,
    status: true,
    isEmailVerified: true,
} satisfies Prisma.UserSelect