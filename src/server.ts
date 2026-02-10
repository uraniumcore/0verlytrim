import dotenv from "dotenv";
import app from "./app.ts";
import connectDB from "./config/db.ts";

dotenv.config();

// В serverless-режиме мы не делаем listen,
// а просто один раз инициализируем БД
connectDB().catch((err) => {
    console.error("Database connection error:", err);
});

// Экспортируем Express-приложение как функцию
export default app;