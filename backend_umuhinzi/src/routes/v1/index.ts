import { Router } from "express";
import farmerRouter from "./farmer.routes.js";

const router = Router();

router.use("/farmers", farmerRouter);

export default router;
