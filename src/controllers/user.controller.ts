import mongoose from "mongoose";
import type { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";

import User from "../models/User.ts";
import Specialist from "../models/Specialist.ts";
import Booking from "../models/Booking.ts";

import AppError from "../utils/apperror.ts";

export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
        return next(new AppError("Unauthorized", 401));
    }

    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
        return next(new AppError("User not found", 404));
    }

    res.status(200).json(user);
}

export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
        return next(new AppError("Unauthorized", 401));
    }

    const { name, email } = req.body;
    const updateData: any = { name, email };

    // Pass the object, NOT 'new User()', and use { new: true } to get the updated doc
    const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        updateData,
        { new: true, runValidators: true } // Returns the updated document and runs validation
    );

    if (!updatedUser) {
        return next(new AppError("User not found", 404));
    }

    res.status(200).json({ status: "success", msg: "User updated!" });
}

export const updatePassword = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
        return next(new AppError("Unauthorized", 401));
    }

    const { password } = req.body;

    if (!password) {
        return next(new AppError("Please provide a password", 400));
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        { password: hashedPassword },
        { new: true, runValidators: true }
    );

    if (!updatedUser) {
        return next(new AppError("User not found", 404));
    }

    res.status(200).json({ status: "success", msg: "Password updated!" });
}

export const createSpecialist = async (req: Request, res: Response, next: NextFunction) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { name, email, password, description, class: level, yearsExperience } = req.body;

        // Проверка обязательных полей
        if (!name || !email || !password || !description || !level || !yearsExperience) {
            return res.status(400).json({ status: "fail", message: "Все поля обязательны" });
        }

        // 1️⃣ создаём User
        const user = new User({
            name,
            email,
            password,
            role: "specialist"
        });
        await user.save({ session }); // сохраняем сессией

        // 2️⃣ создаём Specialist
        const profile = new Specialist({
            user: user._id,
            description,
            class: level,
            yearsExperience
        });
        await profile.save({ session }); // сохраняем сессией

        await session.commitTransaction();
        session.endSession();

        res.status(201).json({
            status: "success",
            data: { user, profile }
        });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
};

export const getAllSpecialists = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const specialists = await User.find({ role: "specialist" })
            .select("-password")
            .lean();

        const specialistProfiles = await Promise.all(
            specialists.map(async (specialist) => {
                const profile = await Specialist.findOne({ user: specialist._id });
                return {
                    ...specialist,
                    profile
                };
            })
        );

        res.status(200).json({
            status: "success",
            results: specialistProfiles.length,
            data: specialistProfiles
        });
    } catch (error) {
        next(error);
    }
};

export const getMyBookings = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
        return next(new AppError("Unauthorized", 401));
    }

    try {
        const bookings = await Booking.find({ user: req.user.id })
            .populate("service")
            .populate({
                path: 'specialist',
                populate: {
                    path: 'user',
                    select: 'name email'
                }
            })
            .sort({ serviceDate: -1 });

        res.status(200).json({
            status: "success",
            results: bookings.length,
            data: bookings
        });
    } catch (error) {
        next(error);
    }
};