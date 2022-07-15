import mongoose, { Schema } from "mongoose";

const userSchema = new Schema ({
    email: {
        type: String,
        unique: true
    },
    login: {
        type: String,
        unique: true
    },
    passwordHashed: String,
    createdAt: {
        type: Date,
        default: () => Date.now()
    }
});

export const User = mongoose.model("User", userSchema);