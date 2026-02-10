import mongoose, { Schema, Document, Model } from "mongoose";

export interface IService extends Document {
    title: string;
    duration: number;
    price: number;
    isActive: boolean;
}

const serviceSchema = new mongoose.Schema<IService>({
    title: { type: String, required: true },
    duration: { type: Number, default: 60, required: true },
    price: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
});

// Compile the schema into a model
const Service: Model<IService> = mongoose.models.Service || mongoose.model<IService>("Service", serviceSchema);

export default Service;