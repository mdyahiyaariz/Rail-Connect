import { Router } from "express";
import { getTrains, getTrain, getTrainWaitlist } from "../controllers/trainController.js";

const router = Router();

router.get("/", getTrains);
router.get("/:id", getTrain);
router.get("/:id/waitlist", getTrainWaitlist);

export default router;
