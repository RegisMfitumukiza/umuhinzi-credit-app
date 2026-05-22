import { prisma } from "../../lib/prisma.js";
import { APIError } from "../../utils/ApiError.js";
import type { CreateInstitutionDto, UpdateInstitutionDto, UpdateInstitutionStatusDto } from "./institution.schema.js";

export const createInstitution = async (userId: string, data: CreateInstitutionDto) => {
  const existing = await prisma.institution.findUnique({ where: { userId } });
  if (existing) throw new APIError("You already have an institution profile.", 409);

  if (data.licenseNumber) {
    const conflict = await prisma.institution.findUnique({ where: { licenseNumber: data.licenseNumber } });
    if (conflict) throw new APIError(`License number '${data.licenseNumber}' is already registered.`, 409);
  }

  if (data.registrationNumber) {
    const conflict = await prisma.institution.findUnique({ where: { registrationNumber: data.registrationNumber } });
    if (conflict) throw new APIError(`Registration number '${data.registrationNumber}' is already registered.`, 409);
  }

  return prisma.institution.create({
    data: {
      userId,
      name: data.name,
      type: data.type,
      licenseNumber: data.licenseNumber ?? null,
      registrationNumber: data.registrationNumber ?? null,
      email: data.email ?? null,
      phone: data.phone ?? null,
      address: data.address ?? null,
      province: data.province ?? null,
      district: data.district ?? null,
      sector: data.sector ?? null,
      cell: data.cell ?? null,
      village: data.village ?? null,
    },
    include: { user: { select: { fullName: true, email: true, role: true } } },
  });
};

export const getAllInstitutions = async (filters?: { status?: string; type?: string; district?: string; search?: string }) => {
  return prisma.institution.findMany({
    where: {
      ...(filters?.status && { status: filters.status as never }),
      ...(filters?.type && { type: filters.type as never }),
      ...(filters?.district && { district: filters.district }),
      ...(filters?.search && {
        OR: [
          { name: { contains: filters.search, mode: "insensitive" } },
          { email: { contains: filters.search, mode: "insensitive" } },
          { licenseNumber: { contains: filters.search, mode: "insensitive" } },
          { registrationNumber: { contains: filters.search, mode: "insensitive" } },
        ],
      }),
    },
    include: { user: { select: { fullName: true, email: true, role: true } } },
    orderBy: { createdAt: "desc" },
  });
};

export const getInstitutionById = async (id: string) => {
  const institution = await prisma.institution.findUnique({
    where: { id },
    include: { user: { select: { fullName: true, email: true, role: true } } },
  });
  if (!institution) throw new APIError(`Institution with id '${id}' not found.`, 404);
  return institution;
};

export const getInstitutionByUserId = async (userId: string) => {
  const institution = await prisma.institution.findUnique({
    where: { userId },
    include: { user: { select: { fullName: true, email: true, role: true } } },
  });
  if (!institution) throw new APIError("Institution profile not found for this user.", 404);
  return institution;
};

export const updateInstitution = async (id: string, data: UpdateInstitutionDto) => {
  await getInstitutionById(id);

  if (data.licenseNumber) {
    const conflict = await prisma.institution.findFirst({ where: { licenseNumber: data.licenseNumber, NOT: { id } } });
    if (conflict) throw new APIError(`License number '${data.licenseNumber}' is already in use.`, 409);
  }

  if (data.registrationNumber) {
    const conflict = await prisma.institution.findFirst({ where: { registrationNumber: data.registrationNumber, NOT: { id } } });
    if (conflict) throw new APIError(`Registration number '${data.registrationNumber}' is already in use.`, 409);
  }

  return prisma.institution.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.type !== undefined && { type: data.type }),
      ...(data.licenseNumber !== undefined && { licenseNumber: data.licenseNumber ?? null }),
      ...(data.registrationNumber !== undefined && { registrationNumber: data.registrationNumber ?? null }),
      ...(data.email !== undefined && { email: data.email ?? null }),
      ...(data.phone !== undefined && { phone: data.phone ?? null }),
      ...(data.address !== undefined && { address: data.address ?? null }),
      ...(data.province !== undefined && { province: data.province ?? null }),
      ...(data.district !== undefined && { district: data.district ?? null }),
      ...(data.sector !== undefined && { sector: data.sector ?? null }),
      ...(data.cell !== undefined && { cell: data.cell ?? null }),
      ...(data.village !== undefined && { village: data.village ?? null }),
    },
    include: { user: { select: { fullName: true, email: true, role: true } } },
  });
};

export const updateInstitutionStatus = async (id: string, data: UpdateInstitutionStatusDto) => {
  const institution = await getInstitutionById(id);
  if (institution.status === data.status) throw new APIError(`Institution status is already '${data.status}'.`, 400);
  return prisma.institution.update({
    where: { id },
    data: { status: data.status as never },
    include: { user: { select: { fullName: true, email: true, role: true } } },
  });
};

export const deleteInstitution = async (id: string) => {
  await getInstitutionById(id);
  await prisma.institution.delete({ where: { id } });
};
