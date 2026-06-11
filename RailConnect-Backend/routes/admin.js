import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { restrictTo } from "../middleware/authorize.js";
import {
    createTrain,
    updateTrain,
    deleteTrain,
    getTrainDetails,
    getStatistics,
} from "../controllers/adminController.js";

const router = Router();

router.use(protect, restrictTo("admin"));

router.post("/train", createTrain);
router.put("/train/:id", updateTrain);
router.delete("/train/:id", deleteTrain);
router.get("/train/:id", getTrainDetails);
router.get("/statistics", getStatistics);

export default router;
