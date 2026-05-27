import type { Request, Response } from "express";

import { asyncHandler } from "../utils/asyncHandler.js";
import { APIError } from "../utils/ApiError.js";
import {
  uploadBufferToCloudinary,
  deleteFromCloudinary,
  getFarmerDocumentsFolder,
  getFarmImagesFolder,
  getInstitutionDocumentsFolder,
  getCooperativeDocumentsFolder,
} from "../utils/cloudinary.helper.js";
import { prisma } from "../lib/prisma.js";
import { writeAuditLog } from "../utils/audit.helper.js";

const getContext = (req: Request) => ({
  actorId: req.user?.id,
  ipAddress: req.ip,
  userAgent: req.headers["user-agent"],
});

/* ─── Helpers ─── */

const resolveFarmerFromUser = async (userId: string) => {
  const farmer = await prisma.farmer.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!farmer) throw new APIError("Farmer profile not found.", 404);
  return farmer;
};

/* ─────────────────────────────────────────
   FARMER DOCUMENT UPLOAD
───────────────────────────────────────── */

export const uploadFarmerDocument = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new APIError("User not authenticated", 401);
  if (!req.file) throw new APIError("Document file is required", 400);

  const farmer = await resolveFarmerFromUser(req.user.id);

  const result = await uploadBufferToCloudinary(req.file.buffer, {
    folder: getFarmerDocumentsFolder(farmer.id),
  });

  await writeAuditLog({
    ...getContext(req),
    action: "FILE_UPLOAD",
    resource: "FARMER",
    resourceId: farmer.id,
    description: "Farmer document uploaded",
    metadata: { publicId: result.publicId, url: result.url },
  });

  res.status(201).json({
    success: true,
    message: "Document uploaded successfully",
    data: { url: result.url, publicId: result.publicId },
  });
});

/* ─────────────────────────────────────────
   FARM IMAGE UPLOAD
───────────────────────────────────────── */

export const uploadFarmImage = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new APIError("User not authenticated", 401);
  if (!req.file) throw new APIError("Image file is required", 400);

  const farmId = String(req.params.farmId);

  // Verify farm belongs to this farmer
  const farmer = await resolveFarmerFromUser(req.user.id);
  const farm = await prisma.farm.findUnique({
    where: { id: farmId },
    select: { id: true, farmerId: true },
  });
  if (!farm) throw new APIError("Farm not found", 404);
  if (farm.farmerId !== farmer.id) throw new APIError("Not authorized to upload to this farm", 403);

  const result = await uploadBufferToCloudinary(req.file.buffer, {
    folder: getFarmImagesFolder(farmId),
  });

  await writeAuditLog({
    ...getContext(req),
    action: "FILE_UPLOAD",
    resource: "FARM",
    resourceId: farmId,
    description: "Farm image uploaded",
    metadata: { publicId: result.publicId, url: result.url },
  });

  res.status(201).json({
    success: true,
    message: "Farm image uploaded successfully",
    data: { url: result.url, publicId: result.publicId },
  });
});

/* ─────────────────────────────────────────
   INSTITUTION DOCUMENT UPLOAD
───────────────────────────────────────── */

export const uploadInstitutionDocument = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new APIError("User not authenticated", 401);
  if (!req.file) throw new APIError("Document file is required", 400);

  const institution = await prisma.institution.findUnique({
    where: { userId: req.user.id },
    select: { id: true },
  });
  if (!institution) throw new APIError("Institution profile not found.", 404);

  const result = await uploadBufferToCloudinary(req.file.buffer, {
    folder: getInstitutionDocumentsFolder(institution.id),
  });

  await writeAuditLog({
    ...getContext(req),
    action: "FILE_UPLOAD",
    resource: "INSTITUTION",
    resourceId: institution.id,
    description: "Institution document uploaded",
    metadata: { publicId: result.publicId, url: result.url },
  });

  res.status(201).json({
    success: true,
    message: "Document uploaded successfully",
    data: { url: result.url, publicId: result.publicId },
  });
});

/* ─────────────────────────────────────────
   COOPERATIVE DOCUMENT UPLOAD
───────────────────────────────────────── */

export const uploadCooperativeDocument = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new APIError("User not authenticated", 401);
  if (!req.file) throw new APIError("Document file is required", 400);

  const cooperativeId = String(req.params.cooperativeId);

  const manager = await prisma.cooperativeManager.findUnique({
    where: { userId: req.user.id },
    select: { cooperativeId: true },
  });
  if (!manager || manager.cooperativeId !== cooperativeId) {
    throw new APIError("Not authorized to upload documents for this cooperative", 403);
  }

  const result = await uploadBufferToCloudinary(req.file.buffer, {
    folder: getCooperativeDocumentsFolder(cooperativeId),
  });

  await writeAuditLog({
    ...getContext(req),
    action: "FILE_UPLOAD",
    resource: "COOPERATIVE",
    resourceId: cooperativeId,
    description: "Cooperative document uploaded",
    metadata: { publicId: result.publicId, url: result.url },
  });

  res.status(201).json({
    success: true,
    message: "Document uploaded successfully",
    data: { url: result.url, publicId: result.publicId },
  });
});

/* ─────────────────────────────────────────
   DELETE FILE
───────────────────────────────────────── */

export const deleteUploadedFile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new APIError("User not authenticated", 401);

  const { publicId } = req.body as { publicId?: string };
  if (!publicId) throw new APIError("publicId is required", 400);

  await deleteFromCloudinary(publicId);

  await writeAuditLog({
    ...getContext(req),
    action: "FILE_DELETE",
    resource: "SYSTEM",
    description: "File deleted from storage",
    metadata: { publicId },
  });

  res.status(200).json({ success: true, message: "File deleted successfully" });
});
