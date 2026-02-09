import type { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import Booking from "../models/Booking.ts";
import User from "../models/User.ts";
import Specialist from "../models/Specialist.ts";

import AppError from "../utils/apperror.ts";
import { issueToken } from "../utils/jwt.ts";

export const updatePastBookings = async () => {
    try {
        const now = new Date();
        await Booking.updateMany(
            {
                status: 'booked',
                endTime: { $lt: now }
            },
            {
                $set: { status: 'completed' }
            }
        );
    } catch (error) {
        console.error("Error updating past bookings:", error);
    }
};

export const createBooking = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await updatePastBookings();
        if (!req.user) {
            return next(new AppError("Unauthorized", 401));
        }

        const { serviceId, specialistId, serviceDate, startTime, endTime, service, specialist } = req.body;

        // Accept either `service`/`specialist` or `serviceId`/`specialistId` keys
        const svcId = serviceId || service;
        const specId = specialistId || specialist;

        // Validate required fields
        if (!svcId || !specId || !serviceDate || !startTime || !endTime) {
            return next(new AppError("Missing required fields", 400));
        }

        // Check date-time validity
        const start = new Date(startTime);
        const end = new Date(endTime);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return next(new AppError("Invalid date format", 400));
        }

        if (end <= start) {
            return next(new AppError("endTime must be after startTime", 400));
        }

        if (start < new Date()) {
            return next(new AppError("Cannot book in the past", 400));
        }

        // Validate "on the hour" and range (9:00 - 20:00)
        const startHour = start.getHours();
        const startMinutes = start.getMinutes();

        if (startMinutes !== 0) {
            return next(new AppError("Bookings must start on the hour (e.g., 10:00)", 400));
        }

        if (startHour < 9 || startHour > 20) {
            return next(new AppError("Bookings must be between 09:00 and 20:00", 400));
        }

        // Check specialist profile exists - accept either Specialist _id or user id
        let specialistProfile = await Specialist.findById(specId).populate('user', 'role name');
        if (!specialistProfile) {
            specialistProfile = await Specialist.findOne({ user: specId }).populate('user', 'role name');
        }

        if (!specialistProfile) {
            return next(new AppError("Specialist not found", 404));
        }

        const specialistToSave = specialistProfile._id;

        // Check for intersection with other bookings using the resolved Specialist._id
        const conflict = await Booking.findOne({
            specialist: specialistToSave,
            serviceDate: new Date(serviceDate),
            status: 'booked',
            $or: [
                { startTime: { $lt: new Date(endTime), $gte: new Date(startTime) } },
                { endTime: { $gt: new Date(startTime), $lte: new Date(endTime) } },
            ],
        });
        if (conflict) return next(new AppError("Time slot already booked", 400));

        // Create booking
        const booking = await Booking.create({
            user: req.user.id,
            service: svcId,
            specialist: specialistToSave,
            serviceDate: new Date(serviceDate),
            startTime: start,
            endTime: end,
            status: 'booked'
        });

        // Populate references
        await booking.populate([
            { path: 'user', select: 'name email' },
            { path: 'service' },
            {
                path: 'specialist',
                populate: {
                    path: 'user',
                    select: 'name email'
                }
            }
        ]);

        res.status(201).json({
            status: 'success',
            data: booking
        });
    } catch (error) {
        next(error);
    }
}

export const getBooking = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await updatePastBookings();
        if (!req.user) {
            return next(new AppError("Unauthorized", 401));
        }

        // Get all bookings for the current user
        const bookings = await Booking.find({ user: req.user.id })
            .populate('service')
            .populate({
                path: 'specialist',
                populate: {
                    path: 'user',
                    select: 'name email'
                }
            })
            .sort({ serviceDate: -1 });

        res.status(200).json({
            status: 'success',
            results: bookings.length,
            data: bookings
        });
    } catch (error) {
        next(error);
    }
}

export const getBookingById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await updatePastBookings();
        if (!req.user) {
            return next(new AppError("Unauthorized", 401));
        }

        const { id } = req.params;

        const booking = await Booking.findById(id)
            .populate('service')
            .populate('user', 'name email')
            .populate({
                path: 'specialist',
                populate: {
                    path: 'user',
                    select: 'name email'
                }
            });

        if (!booking) {
            return next(new AppError("Booking not found", 404));
        }

        // Check if user is the owner or a specialist involved
        if (booking.user._id.toString() !== req.user.id.toString() &&
            booking.specialist._id.toString() !== req.user.id.toString() &&
            req.user.role !== "admin") {
            return next(new AppError("You don't have permission to view this booking", 403));
        }

        res.status(200).json({
            status: 'success',
            data: booking
        });
    } catch (error) {
        next(error);
    }
}

export const changeBooking = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            return next(new AppError("Unauthorized", 401));
        }

        const { id } = req.params;
        const { serviceDate, startTime, endTime, status, specialist, service } = req.body;

        const booking = await Booking.findById(id);

        if (!booking) {
            return next(new AppError("Booking not found", 404));
        }

        // Check if user is the owner
        if (booking.user.toString() !== req.user.id.toString() && req.user.role !== "admin") {
            return next(new AppError("You don't have permission to update this booking", 403));
        }

        // 1-hour cancellation rule
        if (status === 'cancelled' && req.user.role !== 'admin') {
            const now = new Date();
            const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
            if (booking.startTime < oneHourLater) {
                return next(new AppError("Cannot cancel booking less than 1 hour before start time", 400));
            }
        }

        // Specialist change (Admin only)
        if (specialist && req.user.role === 'admin') {
            let specialistProfile = await Specialist.findById(specialist);
            if (!specialistProfile) {
                specialistProfile = await Specialist.findOne({ user: specialist });
            }
            if (!specialistProfile) {
                return next(new AppError("Specialist not found", 404));
            }
            booking.specialist = specialistProfile._id as any;
        } else if (specialist && req.user.role !== 'admin') {
            return next(new AppError("Only admins can change specialists", 403));
        }

        // Service change
        if (service) booking.service = service;

        // Date/Time change
        if (serviceDate) booking.serviceDate = serviceDate;
        if (startTime) {
            const start = new Date(startTime);
            const startHour = start.getHours();
            const startMinutes = start.getMinutes();

            if (startMinutes !== 0) {
                return next(new AppError("Bookings must start on the hour (e.g., 10:00)", 400));
            }

            if (startHour < 9 || startHour > 20) {
                return next(new AppError("Bookings must be between 09:00 and 20:00", 400));
            }
            booking.startTime = startTime;
        }
        if (endTime) booking.endTime = endTime;

        // Status change
        if (status && ['booked', 'cancelled', 'completed'].includes(status)) {
            booking.status = status;
        }

        // Check for conflicts if time/date/specialist changed
        if (serviceDate || startTime || endTime || specialist) {
            const conflict = await Booking.findOne({
                _id: { $ne: booking._id },
                specialist: booking.specialist,
                serviceDate: booking.serviceDate,
                status: 'booked',
                $or: [
                    { startTime: { $lt: booking.endTime, $gte: booking.startTime } },
                    { endTime: { $gt: booking.startTime, $lte: booking.endTime } },
                ],
            });
            if (conflict) return next(new AppError("Time slot already booked", 400));
        }

        await booking.save();
        await booking.populate([
            { path: 'user', select: 'name email' },
            { path: 'service' },
            {
                path: 'specialist',
                populate: {
                    path: 'user',
                    select: 'name email'
                }
            }
        ]);

        res.status(200).json({
            status: 'success',
            data: booking
        });
    } catch (error) {
        next(error);
    }
}

export const getBusySlots = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { specialistId, date } = req.query;

        if (!specialistId || !date) {
            return next(new AppError("Specialist ID and date are required", 400));
        }

        // specialistId might be the Specialist profile ID or User ID
        let specProfile = await Specialist.findById(specialistId);
        if (!specProfile) {
            specProfile = await Specialist.findOne({ user: specialistId });
        }

        if (!specProfile) {
            return next(new AppError("Specialist not found", 404));
        }

        const targetDate = new Date(date as string);
        if (isNaN(targetDate.getTime())) {
            return next(new AppError("Invalid date format", 400));
        }

        // Set date to start of day for comparison
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);

        const bookings = await Booking.find({
            specialist: specProfile._id,
            serviceDate: {
                $gte: startOfDay,
                $lte: endOfDay
            },
            status: 'booked'
        }).select('startTime endTime');

        const busySlots = bookings.map(b => {
            const start = new Date(b.startTime);
            return `${start.getHours().toString().padStart(2, '0')}:00`;
        });

        res.status(200).json({
            status: 'success',
            data: busySlots
        });
    } catch (error) {
        next(error);
    }
}

export const getAllBookings = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await updatePastBookings();
        
        // No check for req.user here because it's handled by middleware, 
        // but we can double check just in case.
        if (!req.user || req.user.role !== "admin") {
            return next(new AppError("You don't have permission to perform this action", 403));
        }

        const bookings = await Booking.find()
            .populate('service')
            .populate('user', 'name email')
            .populate({
                path: 'specialist',
                populate: {
                    path: 'user',
                    select: 'name email'
                }
            })
            .sort({ serviceDate: -1 });

        res.status(200).json({
            status: 'success',
            results: bookings.length,
            data: bookings
        });
    } catch (error) {
        next(error);
    }
}

export const deleteBooking = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            return next(new AppError("Unauthorized", 401));
        }

        const { id } = req.params;

        const booking = await Booking.findById(id);

        if (!booking) {
            return next(new AppError("Booking not found", 404));
        }

        // Check if user is the owner
        if (booking.user.toString() !== req.user.id.toString() && req.user.role !== "admin") {
            return next(new AppError("You don't have permission to delete this booking", 403));
        }

        await Booking.findByIdAndDelete(id);

        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (error) {
        next(error);
    }
}