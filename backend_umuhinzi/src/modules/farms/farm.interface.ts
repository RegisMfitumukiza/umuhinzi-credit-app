import type { Farm } from "../../generated/prisma/client.js";
import type { FarmStatus, LandUnit, OwnershipType } from "../../generated/prisma/client.js";

export type FarmRecord = Farm;

export type CreateFarmInput = {
  name: string;
  landSize: number;
  landUnit: LandUnit;
  ownershipType: OwnershipType;
  soilType: string;
  province: string;
  district: string;
  sector: string;
  cell: string;
  village: string;
  latitude?: number;
  longitude?: number;
  status?: FarmStatus;
};

export type UpdateFarmInput = Partial<CreateFarmInput>;

export type FarmListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: "createdAt" | "updatedAt" | "name" | "landSize" | "district";
  sortOrder?: "asc" | "desc";
  status?: FarmStatus;
  landUnit?: LandUnit;
  ownershipType?: OwnershipType;
  soilType?: string;
  province?: string;
  district?: string;
  sector?: string;
};

export type PaginatedFarmResult = {
  farms: FarmRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
