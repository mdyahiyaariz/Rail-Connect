import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";

import {
    createPassenger,
    updateProfile,
    bookTicketForUser,
    cancelTicketForUser,
    getMyBookings,
    getBookingSummary,
    getUserProfile,
    changePassword,
    getWaitlistPosition,
} from "../controllers/userController.js";

const router = Router();

router.use(protect);

router.get("/profile", getUserProfile);
router.post("/passenger", createPassenger);
router.put("/profile", updateProfile);
router.put("/change-password", changePassword);
router.post("/book", bookTicketForUser);
router.post("/cancel", cancelTicketForUser);
router.get("/bookings", getMyBookings);
router.get("/summary", getBookingSummary);
router.get("/waitlist/:pnr", getWaitlistPosition);

export default router;
