import bcrypt from "bcrypt";
import { pool } from "../db.js";
import { AppError } from "../utils/AppError.js";
import { catchAsync } from "../utils/catchAsync.js";
import { generateToken } from "../utils/generateToken.js";

/* REGISTER */
export const register = catchAsync(async (req, res) => {
    const { name, email, password, phone } = req.body;

    const hashed = await bcrypt.hash(password, 10);

    try {
        await pool.query("CALL register_user(?, ?, ?, ?)", [
            name,
            email,
            hashed,
            phone,
        ]);
    } catch (err) {
        throw new AppError(err.message, 400);
    }

    res.json({ success: true, message: "User Registered Successfully" });
});

/* LOGIN */
export const login = catchAsync(async (req, res) => {
    const { email, password } = req.body;

    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [
        email,
    ]);
    if (!rows.length) throw new AppError("Invalid email or password", 401);

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) throw new AppError("Invalid email or password", 401);

    const token = generateToken(user.user_id);

    res.cookie("jwt", token, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ success: true, message: "Logged in", user });
});

/* LOGOUT */
export const logout = catchAsync(async (req, res) => {
    res.cookie("jwt", "", { maxAge: 1 });
    res.json({ success: true, message: "Logged out" });
});
