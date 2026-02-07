import type { Request, Response, NextFunction } from "express";
import Service from "../models/Service.ts";
import AppError from "../utils/apperror.ts";

/**
 * Create a new service (Admin only)
 */
export const createService = async (req: Request, res: Response, next: NextFunction) => {
    try {
        console.log(req.body);
        const { title, duration, price } = req.body;

        // Validate required fields
        if (!title || !price) {
            return next(new AppError("Title and price are required", 400));
        }

        // Validate price
        if (price < 0) {
            return next(new AppError("Price cannot be negative", 400));
        }

        // Validate duration
        if (duration && duration < 0) {
            return next(new AppError("Duration cannot be negative", 400));
        }

        const service = await Service.create({
            title,
            duration: duration || 60,
            price,
            isActive: true
        });

        res.status(201).json({
            status: 'success',
            data: service
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get all services
 */
export const getAllServices = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { active } = req.query;

        // Filter by active status if provided
        const filter: any = {};
        if (active !== undefined) {
            filter.isActive = active === 'true';
        }

        const services = await Service.find(filter).sort({ title: 1 });

        res.status(200).json({
            status: 'success',
            results: services.length,
            data: services
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get service by ID
 */
export const getServiceById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        const service = await Service.findById(id);

        if (!service) {
            return next(new AppError("Service not found", 404));
        }

        res.status(200).json({
            status: 'success',
            data: service
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update service (Admin only)
 */
export const updateService = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { title, duration, price, isActive } = req.body;

        const service = await Service.findById(id);

        if (!service) {
            return next(new AppError("Service not found", 404));
        }

        // Validate price if provided
        if (price !== undefined && price < 0) {
            return next(new AppError("Price cannot be negative", 400));
        }

        // Validate duration if provided
        if (duration !== undefined && duration < 0) {
            return next(new AppError("Duration cannot be negative", 400));
        }

        // Update fields
        if (title) service.title = title;
        if (duration !== undefined) service.duration = duration;
        if (price !== undefined) service.price = price;
        if (isActive !== undefined) service.isActive = isActive;

        await service.save();

        res.status(200).json({
            status: 'success',
            data: service
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete service (Admin only)
 */
export const deleteService = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        const service = await Service.findByIdAndDelete(id);

        if (!service) {
            return next(new AppError("Service not found", 404));
        }

        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (error) {
        next(error);
    }
};
