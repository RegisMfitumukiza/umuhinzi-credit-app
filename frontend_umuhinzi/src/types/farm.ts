export type FarmStatus = "ACTIVE" | "INACTIVE";
export type LandUnit = "HECTARE" | "ACRE";
export type OwnershipType = "OWNED" | "RENTED" | "FAMILY_LAND" | "COOPERATIVE_LAND";

export type Farm = {
  id: string;
  farmerId: string;
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
  latitude?: number | null;
  longitude?: number | null;
  status: FarmStatus;
  createdAt: string;
  updatedAt: string;
};

export type FarmListResponse = {
  farms: Farm[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type FarmQuery = {
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

export type FarmFormValues = {
  name: string;
  landSize: string;
  landUnit: LandUnit;
  ownershipType: OwnershipType;
  soilType: string;
  province: string;
  district: string;
  sector: string;
  cell: string;
  village: string;
  latitude: string;
  longitude: string;
  status: FarmStatus;
};

export const emptyFarmValues: FarmFormValues = {
  name: "",
  landSize: "",
  landUnit: "HECTARE",
  ownershipType: "OWNED",
  soilType: "",
  province: "",
  district: "",
  sector: "",
  cell: "",
  village: "",
  latitude: "",
  longitude: "",
  status: "ACTIVE",
};
