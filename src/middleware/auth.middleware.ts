import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import AppError from "../utils/apperror.ts";

dotenv.config();

// Проверяем, что секрет точно есть
if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in environment");
}
const JWT_SECRET = process.env.JWT_SECRET;

// Расширяем Express Request
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                role: "user" | "admin" | "barber";
            };
        }
    }
}

// Тип полезной нагрузки токена
interface JwtPayload {
    id: string;
    role: "user" | "admin" | "barber";
}

/**
 * Middleware: проверка токена
 * Если токен валиден → добавляем req.user
 * Если нет → бросаем ошибку
 */
export const verifyToken = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            throw new AppError("Missing authorization header", 401);
        }

        const token = authHeader.startsWith("Bearer ")
            ? authHeader.slice(7)
            : authHeader;

        if (!token) {
            throw new AppError("No token provided", 401);
        }

        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

        // Добавляем информацию о пользователе в запрос
        req.user = {
            id: decoded.id,
            role: decoded.role
        };

        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            next(new AppError("Token has expired", 401));
        } else if (error instanceof jwt.JsonWebTokenError) {
            next(new AppError("Invalid token", 401));
        } else if (error instanceof AppError) {
            next(error);
        } else {
            next(new AppError("Authentication failed", 401));
        }
    }
};

/**
 * Middleware: доступ только для админов
 * Использовать **после verifyToken**
 */
export const adminOnly = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    if (!req.user) {
        return next(new AppError("Not authenticated", 401));
    }

    if (req.user.role !== "admin") {
        return next(new AppError("Access denied", 403));
    }

    next();
};
