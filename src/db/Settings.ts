import mongoose, { Schema } from "mongoose";

const settingsSchema = new Schema ({
    // TODO Application settings
});

export const Item = mongoose.model("Settings", settingsSchema);