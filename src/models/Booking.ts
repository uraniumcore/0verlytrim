import mongoose, { Schema } from "mongoose";

const bookingSchema = new mongoose.Schema({
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
    barber: {
        type: Schema.Types.ObjectId,
        ref: 'User',
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
const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;