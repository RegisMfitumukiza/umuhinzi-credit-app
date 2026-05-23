import { Request, Response } from "express";
import { Role } from "../../generated/prisma/client.js";
import { APIError } from "../../utils/ApiError.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendCreated, sendResponse } from "../../utils/response.js";
import {
  assertFarmOwnership,
  createFarm,
  deleteFarm,
  getFarmById,
  listAllFarms,
  listFarmerFarms,
  updateFarm,
} from "./farm.service.js";
import type { FarmListQueryInput } from "./farm.validation.js";

const requireFarmerProfile = (req: Request) => {
  if (!req.user?.farmerId) {
    throw new APIError("Farmer profile not found for this account", 404);
  }

  return req.user.farmerId;
};

export const createFarmController = asyncHandler(async (req: Request, res: Response) => {
  if (req.user?.role !== Role.FARMER) {
    throw new APIError("Only farmers can create farms", 403);
  }

  const farmerId = requireFarmerProfile(req);
  const farm = await createFarm(farmerId, req.body);

  return sendCreated(res, "Farm created successfully", farm);
});

export const getMyFarmsController = asyncHandler(async (req: Request, res: Response) => {
  const farmerId = requireFarmerProfile(req);
  const farms = await listFarmerFarms(farmerId, req.query as unknown as FarmListQueryInput);

  return sendResponse(res, 200, "Farms retrieved successfully", farms.farms, farms.pagination);
});

export const getFarmByIdController = asyncHandler(async (req: Request, res: Response) => {
  const farm = await getFarmById(req.params.id);

  if (!farm) {
    throw new APIError("Farm not found", 404);
  }

  if (req.user?.role !== Role.ADMIN) {
    assertFarmOwnership({ farmerId: farm.farmerId }, requireFarmerProfile(req));
  }

  return sendResponse(res, 200, "Farm retrieved successfully", farm);
});

export const updateFarmController = asyncHandler(async (req: Request, res: Response) => {
  const farm = await getFarmById(req.params.id);

  if (!farm) {
    throw new APIError("Farm not found", 404);
  }

  if (req.user?.role !== Role.ADMIN) {
    assertFarmOwnership({ farmerId: farm.farmerId }, requireFarmerProfile(req));
  }

  const updatedFarm = await updateFarm(req.params.id, req.body);

  return sendResponse(res, 200, "Farm updated successfully", updatedFarm);
});

export const deleteFarmController = asyncHandler(async (req: Request, res: Response) => {
  const farm = await getFarmById(req.params.id);

  if (!farm) {
    throw new APIError("Farm not found", 404);
  }

  if (req.user?.role !== Role.ADMIN) {
    assertFarmOwnership({ farmerId: farm.farmerId }, requireFarmerProfile(req));
  }

  await deleteFarm(req.params.id);

  return sendResponse(res, 200, "Farm deleted successfully", null);
});

export const getAllFarmsController = asyncHandler(async (req: Request, res: Response) => {
  const farms = await listAllFarms(req.query as unknown as FarmListQueryInput);

  return sendResponse(res, 200, "Farms retrieved successfully", farms.farms, farms.pagination);
});
