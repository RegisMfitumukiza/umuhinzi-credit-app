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
  _count: {
    select: {
      farms: true,
      livestock: true,
      loanApplications: true,
    },
  },
} satisfies Prisma.FarmerSelect;

export const farmerAdminListSelect = {
  ...farmerWithUserSelect,
  productivityRecords: {
    take: 1,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      season: {
        select: {
          id: true,
          name: true,
          year: true,
        },
      },
    },
  },
} satisfies Prisma.FarmerSelect;
