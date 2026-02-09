import express from "express";

import { createBooking, getBooking, getBookingById, changeBooking, deleteBooking, getAllBookings, getBusySlots} from "../controllers/booking.controller.ts";

import { verifyToken, adminOnly } from "../middleware/auth.middleware.ts";

const bookingRoutes = express.Router();

// Get busy slots for specialist and date
bookingRoutes.get("/busy-slots", getBusySlots);

// Get all bookings (admin only)
bookingRoutes.get("/all", verifyToken, adminOnly, getAllBookings);

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