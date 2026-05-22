import { prisma } from "../lib/prisma.js";
import { APIError } from "../utils/ApiError.js";
import { Role } from "../generated/prisma/client.js";
import type {
  CreateFarmerInput,
  UpdateFarmerInput,
  UpdateFarmerCredibilityInput,
  AssignFarmerToCooperativeInput,
} from "../validators/farmer.schema.js";

/* ================= SHARED SELECT ================= */

const farmerSelect = {
  id: true,
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
      isEmailVerified: true,
    },
  },
  cooperative: {
    select: {
      id: true,
      name: true,
      registrationNumber: true,
      district: true,
      sector: true,
    },
  },
} as const;

/* ================= HELPERS ================= */

async function findFarmerOrThrow(farmerId: string) {
  const farmer = await prisma.farmer.findUnique({
    where: { id: farmerId },
    select: { id: true, userId: true, status: true, cooperativeId: true },
  });
  if (!farmer) throw new APIError("Farmer not found", 404);
  return farmer;
}

async function validateCooperative(cooperativeId: string) {
  const cooperative = await prisma.cooperative.findUnique({
    where: { id: cooperativeId },
    select: { id: true },
  });
  if (!cooperative) throw new APIError("Cooperative not found", 404);
}

/* ================= CREATE ================= */

export const createFarmerProfile = async (userId: string, data: CreateFarmerInput) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });

  if (!user) throw new APIError("User not found", 404);

  if (user.role !== Role.FARMER) {
    throw new APIError("Only users with the FARMER role can create a farmer profile", 403);
  }

  const existing = await prisma.farmer.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (existing) throw new APIError("Farmer profile already exists for this account", 409);

  if (data.cooperativeId) {
    await validateCooperative(data.cooperativeId);
  }

  return prisma.farmer.create({
    data: { userId, ...data },
    select: farmerSelect,
  });
};

/* ================= READ ================= */

export const getFarmerById = async (farmerId: string) => {
  const farmer = await prisma.farmer.findUnique({
    where: { id: farmerId },
    select: farmerSelect,
  });

  if (!farmer) throw new APIError("Farmer not found", 404);

  return farmer;
};

/* ================= UPDATE PROFILE ================= */

export const updateFarmerProfile = async (
  farmerId: string,
  requesterId: string,
  requesterRole: Role,
  data: UpdateFarmerInput
) => {
  const farmer = await findFarmerOrThrow(farmerId);

  if (requesterRole !== Role.ADMIN && farmer.userId !== requesterId) {
    throw new APIError("Access denied: you can only update your own profile", 403);
  }

  if (data.cooperativeId) {
    await validateCooperative(data.cooperativeId);
  }

  // status and credibilityStatus are changed through dedicated endpoints only
  const { status: _s, credibilityStatus: _c, ...profileData } = data;

  return prisma.farmer.update({
    where: { id: farmerId },
    data: profileData,
    select: farmerSelect,
  });
};

/* ================= VERIFY ================= */

export const verifyFarmer = async (farmerId: string) => {
  const farmer = await findFarmerOrThrow(farmerId);

  if (farmer.status === "VERIFIED") {
    throw new APIError("Farmer is already verified", 409);
  }

  return prisma.farmer.update({
    where: { id: farmerId },
    data: { status: "VERIFIED" },
    select: farmerSelect,
  });
};

/* ================= SUSPEND ================= */

export const suspendFarmer = async (farmerId: string) => {
  const farmer = await findFarmerOrThrow(farmerId);

  if (farmer.status === "SUSPENDED") {
    throw new APIError("Farmer is already suspended", 409);
  }

  return prisma.farmer.update({
    where: { id: farmerId },
    data: { status: "SUSPENDED" },
    select: farmerSelect,
  });
};

/* ================= CREDIBILITY ================= */

export const updateFarmerCredibility = async (
  farmerId: string,
  data: UpdateFarmerCredibilityInput
) => {
  await findFarmerOrThrow(farmerId);

  return prisma.farmer.update({
    where: { id: farmerId },
    data: { credibilityStatus: data.credibilityStatus },
    select: farmerSelect,
  });
};

/* ================= COOPERATIVE ================= */

export const assignFarmerToCooperative = async (
  farmerId: string,
  data: AssignFarmerToCooperativeInput
) => {
  await findFarmerOrThrow(farmerId);
  await validateCooperative(data.cooperativeId);

  return prisma.farmer.update({
    where: { id: farmerId },
    data: { cooperativeId: data.cooperativeId },
    select: farmerSelect,
  });
};

export const removeFarmerFromCooperative = async (farmerId: string) => {
  const farmer = await findFarmerOrThrow(farmerId);

  if (!farmer.cooperativeId) {
    throw new APIError("Farmer is not assigned to any cooperative", 409);
  }

  return prisma.farmer.update({
    where: { id: farmerId },
    data: { cooperativeId: null },
    select: farmerSelect,
  });
};
