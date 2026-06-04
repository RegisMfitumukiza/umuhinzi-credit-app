import type { Prisma } from "../../generated/prisma/client.js";

export const safeFarmerSelect = {
  id: true,
  userId: true,
  nationalId: true,
  dateOfBirth: true,
  gender: true,
  farmingExperienceYears: true,
  primaryCrop: true,
  credibilityStatus: true,
  status: true,
  cooperativeId: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.FarmerSelect;

export const farmerWithUserSelect = {
  id: true,
  userId: true,
  nationalId: true,
  dateOfBirth: true,
  gender: true,
  farmingExperienceYears: true,
  primaryCrop: true,
  credibilityStatus: true,
  status: true,
  cooperativeId: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      province: true,
      district: true,
      sector: true,
      cell: true,
      village: true,
      profileImageUrl: true,
    },
  },
  cooperativeMembership: {
    select: {
      id: true,
      status: true,
      joinedAt: true,
      cooperative: {
        select: {
          id: true,
          name: true,
          district: true,
          status: true,
        },
      },
    },
  },
  creditScores: {
    take: 1,
    orderBy: { generatedAt: "desc" as const },
    select: {
      id: true,
      score: true,
      riskLevel: true,
      summary: true,
      generatedAt: true,
    },
  },
  _count: {
    select: {
      farms: true,
      livestock: true,
      loanApplications: true,
      loans: true,
      creditScores: true,
    },
  },
} satisfies Prisma.FarmerSelect;
