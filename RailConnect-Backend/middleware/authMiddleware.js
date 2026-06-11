import jwt from "jsonwebtoken";
import { AppError } from "../utils/AppError.js";
import { pool } from "../db.js";

export const protect = async (req, res, next) => {
    try {
        const token = req.cookies?.jwt;
        if (!token) throw new AppError("Not logged in", 401);

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const [rows] = await pool.query(
            "SELECT * FROM users WHERE user_id = ?",
            [decoded.id]
        );

        if (!rows.length)
            throw new AppError("Invalid token, user not found", 401);

        req.user = rows[0];
        next();
    } catch (err) {
        next(err);
    }
};
