import express from "express";

import { createBooking, getBooking, getBookingById, changeBooking, deleteBooking} from "../controllers/booking.controller.ts";

import { verifyToken } from "../middleware/auth.middleware.ts";

const bookingRoutes = express.Router();

// Create booking
bookingRoutes.post("/", verifyToken, createBooking);

// Get all bookings
bookingRoutes.get("/", verifyToken, getBooking);

// Get specific booking
bookingRoutes.get("/:id", verifyToken, getBookingById);

// Change booking
bookingRoutes.put("/:id", verifyToken, changeBooking);

// Delete booking
bookingRoutes.delete("/:id", verifyToken, deleteBooking);

export default bookingRoutes;