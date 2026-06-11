import { catchAsync } from "../utils/catchAsync.js";

export const dummy = catchAsync(async (req, res) => {
    res.json({ message: "Booking routes available inside /user endpoints" });
});
