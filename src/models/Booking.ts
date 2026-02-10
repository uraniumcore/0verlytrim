import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBooking extends Document {
    user: mongoose.Types.ObjectId;
    service: mongoose.Types.ObjectId;
    specialist: mongoose.Types.ObjectId;
    serviceDate: Date;
    startTime: Date;
    endTime: Date;
    status: 'booked' | 'cancelled' | 'completed';
    createdAt: Date;
}

const bookingSchema = new mongoose.Schema<IBooking>({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    service: {
        type: Schema.Types.ObjectId,
        ref: 'Service',
        required: true
    },
    specialist: {
        type: Schema.Types.ObjectId,
        ref: 'Specialist',
        required: true
    },
    serviceDate: { type: Date, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    status: {
        type: String,
        enum: ['booked', 'cancelled', 'completed'],
        default: 'booked',
        required: true
    },
    createdAt: { type: Date, default: Date.now }
});

// Compile the schema into a model
const Booking: Model<IBooking> = mongoose.models.Booking || mongoose.model<IBooking>("Booking", bookingSchema);

export default Booking;