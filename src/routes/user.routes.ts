import express from "express";

import { getProfile, updateProfile, updatePassword, getAllSpecialists, createSpecialist, updateSpecialist, deleteSpecialist, getMyBookings } from "../controllers/user.controller.ts";

import { verifyToken, adminOnly } from "../middleware/auth.middleware.ts";

const userRoutes = express.Router();

// Profile
userRoutes.get("/profile", verifyToken, getProfile);

// Update Profile
userRoutes.put("/profile", verifyToken, updateProfile);

// Update Password
userRoutes.put("/update-password", verifyToken, updatePassword);

// My Bookings
userRoutes.get("/myBookings", verifyToken, getMyBookings);

// публичный
userRoutes.get("/specialist", getAllSpecialists);

// admin
userRoutes.post("/specialist", verifyToken, adminOnly, createSpecialist);
userRoutes.put("/specialist/:id", verifyToken, adminOnly, updateSpecialist);
userRoutes.delete("/specialist/:id", verifyToken, adminOnly, deleteSpecialist);

export default userRoutes;