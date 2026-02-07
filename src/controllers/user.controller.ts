import type { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";

import User from "../models/User.ts";

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

    const { name, email, password } = req.body;
    const updateData: any = { name, email };

    if (password) {
        const salt = await bcrypt.genSalt(10);
        updateData.password = await bcrypt.hash(password, salt);
    }

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