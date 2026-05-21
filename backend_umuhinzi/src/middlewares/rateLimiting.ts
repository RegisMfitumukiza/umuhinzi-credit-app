import rateLimit from "express-rate-limit";

export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    legacyHeaders: false,
    standardHeaders: true,
    message: {
        success: false,
        message: "Too many requests from this IP, please try again later."
    }
});

export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, 
    legacyHeaders: false,
    standardHeaders: true,
    message: {
        success: false,
        message: "Too many login attempts from this IP, please try again later."
    }
});