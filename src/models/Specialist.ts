import mongoose, { Schema } from "mongoose";

const specialistSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        unique: true,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    class: {
        type: String,
        required: true
    },
    yearsExperience: {
        type: Number,
        min: 0,
        required: true
    }
});

// Compile the schema into a model
const Specialist = mongoose.model("Specialist", specialistSchema);

export default Specialist;