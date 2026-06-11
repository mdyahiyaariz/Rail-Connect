import { AppError } from "../utils/AppError.js";

export const errorHandler = (err, req, res, next) => {
    console.log("Error :: ", err.message);

    if (!(err instanceof AppError)) {
        err = new AppError(err.message || "Internal server error", 500);
    }

    res.status(err.statusCode).json({
        success: false,
        status: err.status,
        message: err.message,
    });
};
