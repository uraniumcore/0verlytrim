import express from "express";

import { login, register, logout } from "../controllers/auth.controller.ts";

const authRoutes = express.Router();

// Login
authRoutes.post("/login", login);

// Register
authRoutes.post("/register", register);

// Logout
authRoutes.post("/logout", logout);

export default authRoutes;