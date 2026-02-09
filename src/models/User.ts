import mongoose, { Schema } from "mongoose";

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: { type: String, required: true },
    role: {
        type: String,
        enum: ['customer', 'specialist', 'admin'],
        default: 'customer'
    },
    date: { type: Date, default: Date.now },
});

// Compile the schema into a model
const User = mongoose.model("User", userSchema);

export default User;