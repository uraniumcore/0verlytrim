import express from "express";

import { createService, getAllServices, getServiceById, updateService, deleteService} from "../controllers/service.controller.ts";

import { verifyToken, adminOnly } from "../middleware/auth.middleware.ts";

const serviceRoutes = express.Router();

// Create booking
serviceRoutes.post("/", verifyToken, adminOnly, createService);

// Get all bookings
serviceRoutes.get("/", verifyToken, adminOnly, getAllServices);

// Get specific booking
serviceRoutes.get("/:id", verifyToken, adminOnly, getServiceById);

// Change booking
serviceRoutes.put("/:id", verifyToken, adminOnly, updateService);

// Delete booking
serviceRoutes.delete("/:id", verifyToken, adminOnly, deleteService);

export default serviceRoutes;