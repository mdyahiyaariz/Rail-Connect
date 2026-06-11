import { Router } from "express";
import { dummy } from "../controllers/bookingController.js";

const router = Router();

router.get("/", dummy);

export default router;
