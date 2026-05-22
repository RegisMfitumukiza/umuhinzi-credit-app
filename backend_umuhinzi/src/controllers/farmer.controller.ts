import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as farmerService from "../services/farmer.service.js";
import type {
  CreateFarmerInput,
  UpdateFarmerInput,
  UpdateFarmerCredibilityInput,
  AssignFarmerToCooperativeInput,
} from "../validators/farmer.schema.js";
import { Role } from "../generated/prisma/client.js";

/* ================= CREATE ================= */

export const createFarmerProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const data = req.body as CreateFarmerInput;

  const farmer = await farmerService.createFarmerProfile(userId, data);

  res.status(201).json({
    success: true,
    message: "Farmer profile created successfully",
    data: farmer,
  });
});

/* ================= READ ================= */

export const getFarmerById = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const farmer = await farmerService.getFarmerById(id);

  res.status(200).json({
    success: true,
    data: farmer,
  });
});

/* ================= UPDATE PROFILE ================= */

export const updateFarmerProfile = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const requesterId = req.user!.userId;
  const requesterRole = req.user!.role as Role;
  const data = req.body as UpdateFarmerInput;

  const farmer = await farmerService.updateFarmerProfile(id, requesterId, requesterRole, data);

  res.status(200).json({
    success: true,
    message: "Farmer profile updated successfully",
    data: farmer,
  });
});

/* ================= VERIFY ================= */

export const verifyFarmer = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const farmer = await farmerService.verifyFarmer(id);

  res.status(200).json({
    success: true,
    message: "Farmer verified successfully",
    data: farmer,
  });
});

/* ================= SUSPEND ================= */

export const suspendFarmer = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const farmer = await farmerService.suspendFarmer(id);

  res.status(200).json({
    success: true,
    message: "Farmer suspended successfully",
    data: farmer,
  });
});

/* ================= CREDIBILITY ================= */

export const updateFarmerCredibility = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const data = req.body as UpdateFarmerCredibilityInput;

  const farmer = await farmerService.updateFarmerCredibility(id, data);

  res.status(200).json({
    success: true,
    message: "Farmer credibility updated successfully",
    data: farmer,
  });
});

/* ================= COOPERATIVE ================= */

export const assignFarmerToCooperative = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const data = req.body as AssignFarmerToCooperativeInput;

  const farmer = await farmerService.assignFarmerToCooperative(id, data);

  res.status(200).json({
    success: true,
    message: "Farmer assigned to cooperative successfully",
    data: farmer,
  });
});

export const removeFarmerFromCooperative = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const farmer = await farmerService.removeFarmerFromCooperative(id);

  res.status(200).json({
    success: true,
    message: "Farmer removed from cooperative successfully",
    data: farmer,
  });
});
