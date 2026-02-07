import type { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";

import User from "../models/User.ts";

import AppError from "../utils/apperror.ts";
import { issueToken } from "../utils/jwt.ts";

export const login = async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    // Check if the user exists
    let user = await User.findOne({ email });
    if (!user) {
        return next(new AppError("Invalid email!", 400));
    }

    // Compare the provided password with the stored hashed password
    const passwordMatch = await bcrypt.compare(password, user.password);
    console.log(password, user.password);

    if (passwordMatch) {
        // Passwords match, proceed with login (e.g., create session, issue JWT)
        const token = issueToken(user._id, user.role);
        res.status(200).json({ token, msg: 'Login successful!' });
    } else {
        // Passwords do not match
        res.status(401).json({ error: 'Invalid email or password.' });
    }
}

export const register = async (req: Request, res: Response, next: NextFunction) => {
    const { name, email, password } = req.body;

    // Check if the user already exists
    let user = await User.findOne({ email });
    if (user) {
        return next(new AppError("User already exists", 400));
    }

    // Create a new user instance
    user = new User({
        name,
        email,
        password
    });

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // Save the user to the database
    const savedUser = await user.save();

    const token = issueToken(savedUser._id, savedUser.role);

    res.status(201).json({ token, msg: 'User registered successfully' });
}

/**
 * Logout user - clears authentication token from client side
 * Since we're using JWT, logout is handled on the client by removing the token
 */
export const logout = (req: Request, res: Response, next: NextFunction) => {
    try {
        res.status(200).json({
            status: 'success',
            msg: 'Logged out successfully'
        });
    } catch (error) {
        next(error);
    }
} 