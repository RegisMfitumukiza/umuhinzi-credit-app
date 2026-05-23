import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import { APIError } from "../../utils/ApiError.js";
import { getPagination } from "../../utils/pagination.js";
import type { CreateFarmBody, FarmListQueryInput, UpdateFarmBody } from "./farm.validation.js";

const farmSelect = {
  id: true,
  farmerId: true,
  name: true,
  landSize: true,
  landUnit: true,
  ownershipType: true,
  soilType: true,
  province: true,
  district: true,
  sector: true,
  cell: true,
  village: true,
  latitude: true,
  longitude: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

const buildFarmWhere = (query: FarmListQueryInput, farmerId?: string): Prisma.FarmWhereInput => {
  const filters: Prisma.FarmWhereInput[] = [];

  if (farmerId) {
    filters.push({ farmerId });
  }

  if (query.search) {
    filters.push({
      OR: [
        { name: { contains: query.search, mode: "insensitive" } },
        { district: { contains: query.search, mode: "insensitive" } },
        { sector: { contains: query.search, mode: "insensitive" } },
        { cell: { contains: query.search, mode: "insensitive" } },
        { village: { contains: query.search, mode: "insensitive" } },
      ],
    });
  }

  if (query.status) filters.push({ status: query.status });
  if (query.landUnit) filters.push({ landUnit: query.landUnit });
  if (query.ownershipType) filters.push({ ownershipType: query.ownershipType });
  if (query.soilType) filters.push({ soilType: query.soilType });
  if (query.province) filters.push({ province: { contains: query.province, mode: "insensitive" } });
  if (query.district) filters.push({ district: { contains: query.district, mode: "insensitive" } });
  if (query.sector) filters.push({ sector: { contains: query.sector, mode: "insensitive" } });

  return filters.length > 0 ? { AND: filters } : {};
};

export const createFarm = async (farmerId: string, payload: CreateFarmBody) => {
  return prisma.farm.create({
    data: {
      farmerId,
      ...payload,
    },
    select: farmSelect,
  });
};

export const getFarmById = async (farmId: string) => {
  return prisma.farm.findUnique({
    where: { id: farmId },
    select: farmSelect,
  });
};

export const listFarmerFarms = async (farmerId: string, query: FarmListQueryInput) => {
  const { page, limit, skip } = getPagination(query.limit, query.page);
  const where = buildFarmWhere(query, farmerId);
  const orderBy = {
    [query.sortBy ?? "createdAt"]: query.sortOrder ?? "desc",
  } as Prisma.FarmOrderByWithRelationInput;

  const [farms, total] = await Promise.all([
    prisma.farm.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      select: farmSelect,
    }),
    prisma.farm.count({ where }),
  ]);

  return {
    farms,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(Math.ceil(total / limit), 1),
    },
  };
};

export const listAllFarms = async (query: FarmListQueryInput) => {
  const { page, limit, skip } = getPagination(query.limit, query.page);
  const where = buildFarmWhere(query);
  const orderBy = {
    [query.sortBy ?? "createdAt"]: query.sortOrder ?? "desc",
  } as Prisma.FarmOrderByWithRelationInput;

  const [farms, total] = await Promise.all([
    prisma.farm.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      select: farmSelect,
    }),
    prisma.farm.count({ where }),
  ]);

  return {
    farms,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(Math.ceil(total / limit), 1),
    },
  };
};

export const updateFarm = async (farmId: string, payload: UpdateFarmBody) => {
  return prisma.farm.update({
    where: { id: farmId },
    data: payload,
    select: farmSelect,
  });
};

export const deleteFarm = async (farmId: string) => {
  await prisma.farm.delete({
    where: { id: farmId },
  });
};

export const assertFarmOwnership = (farm: { farmerId: string }, farmerId?: string) => {
  if (!farmerId || farm.farmerId !== farmerId) {
    throw new APIError("You do not have permission to access this farm", 403);
  }
};
