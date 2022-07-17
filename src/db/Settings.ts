import mongoose, { Schema } from "mongoose";

const settingsSchema = new Schema ({
    categoryTree: {
        type: String,
        required: true
    }
});

export const Settings = mongoose.model("Settings", settingsSchema);