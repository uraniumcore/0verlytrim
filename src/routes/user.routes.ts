import express from "express";

import { getProfile, updateProfile } from "../controllers/user.controller.ts";

import { verifyToken } from "../middleware/auth.middleware.ts";

const userRoutes = express.Router();

// Profile
userRoutes.get("/profile", verifyToken, getProfile);

// Update Profile
userRoutes.put("/profile", verifyToken, updateProfile);

export default userRoutes;