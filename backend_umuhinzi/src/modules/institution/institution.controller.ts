import type { Request, Response, NextFunction } from "express";
import * as service from "./institution.service.js";
import { CreateInstitutionSchema, UpdateInstitutionSchema, UpdateInstitutionStatusSchema } from "./institution.schema.js";

export const createInstitution = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto = CreateInstitutionSchema.parse(req.body);
    const institution = await service.createInstitution(req.user!.userId, dto);
    res.status(201).json({ success: true, data: institution });
  } catch (err) { next(err); }
};

export const getAllInstitutions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, type, district, search } = req.query as Record<string, string>;
    const institutions = await service.getAllInstitutions({ status, type, district, search });
    res.json({ success: true, data: institutions });
  } catch (err) { next(err); }
};

export const getInstitutionById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const institution = await service.getInstitutionById(req.params.id as string);
    res.json({ success: true, data: institution });
  } catch (err) { next(err); }
};

export const getMyInstitution = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const institution = await service.getInstitutionByUserId(req.user!.userId);
    res.json({ success: true, data: institution });
  } catch (err) { next(err); }
};

export const updateInstitution = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto = UpdateInstitutionSchema.parse(req.body);
    const institution = await service.updateInstitution(req.params.id as string, dto);
    res.json({ success: true, data: institution });
  } catch (err) { next(err); }
};

export const updateInstitutionStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto = UpdateInstitutionStatusSchema.parse(req.body);
    const institution = await service.updateInstitutionStatus(req.params.id as string, dto);
    res.json({ success: true, data: institution });
  } catch (err) { next(err); }
};

export const deleteInstitution = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await service.deleteInstitution(req.params.id as string);
    res.json({ success: true, message: "Institution deleted successfully." });
  } catch (err) { next(err); }
};
