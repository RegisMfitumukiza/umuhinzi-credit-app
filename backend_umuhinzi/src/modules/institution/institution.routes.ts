import { Router } from "express";
import * as controller from "./institution.controller.js";
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";

const router = Router();

// Institution member routes
router.post("/", authenticate, authorize("INSTITUTION"), controller.createInstitution);
router.get("/me", authenticate, authorize("INSTITUTION"), controller.getMyInstitution);
router.put("/me/:id", authenticate, authorize("INSTITUTION"), controller.updateInstitution);

// Admin routes
router.get("/", authenticate, authorize("ADMIN"), controller.getAllInstitutions);
router.get("/:id", authenticate, authorize("ADMIN"), controller.getInstitutionById);
router.patch("/:id/status", authenticate, authorize("ADMIN"), controller.updateInstitutionStatus);
router.delete("/:id", authenticate, authorize("ADMIN"), controller.deleteInstitution);

export default router;
