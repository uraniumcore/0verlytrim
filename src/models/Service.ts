import mongoose, { Schema } from "mongoose";

const serviceSchema = new mongoose.Schema({
    title: { type: String, required: true },
    duration: { type: Number, default: 60, required: true },
    price: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
});

// Compile the schema into a model
const Service = mongoose.models.Service || mongoose.model("Service", serviceSchema);

export default Service;