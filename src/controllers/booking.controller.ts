import type { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import Booking from "../models/Booking.ts";
import User from "../models/User.ts";
import Specialist from "../models/Specialist.ts";

import AppError from "../utils/apperror.ts";
import { issueToken } from "../utils/jwt.ts";

export const createBooking = async (req: Request, res: Response, next: NextFunction) => {
    try {
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
        const { serviceDate, startTime, endTime, status } = req.body;

        const booking = await Booking.findById(id);

        if (!booking) {
            return next(new AppError("Booking not found", 404));
        }

        // Check if user is the owner
        if (booking.user.toString() !== req.user.id.toString() && req.user.role !== "admin") {
            return next(new AppError("You don't have permission to update this booking", 403));
        }

        // Update allowed fields
        if (serviceDate) booking.serviceDate = serviceDate;
        if (startTime) booking.startTime = startTime;
        if (endTime) booking.endTime = endTime;
        if (status && ['booked', 'cancelled', 'completed'].includes(status)) {
            booking.status = status;
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