import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISpecialist extends Document {
    user: mongoose.Types.ObjectId;
    description: string;
    class: string;
    yearsExperience: number;
}

const specialistSchema = new Schema<ISpecialist>({
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
const Specialist: Model<ISpecialist> = mongoose.models.Specialist || mongoose.model<ISpecialist>("Specialist", specialistSchema);

export default Specialist;