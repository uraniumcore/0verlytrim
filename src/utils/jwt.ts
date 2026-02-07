import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

// Проверяем, что секрет точно есть
if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in environment");
}
const JWT_SECRET = process.env.JWT_SECRET ?? "super-secret-key-type-shift";

export const issueToken = (userId: any, userRole: any) => {
    const payload = { id: userId, role: userRole };

    const token = jwt.sign(
        payload,
        JWT_SECRET,
        { expiresIn: "1d" }
    );

    return token;
}