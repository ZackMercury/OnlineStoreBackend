import mongoose, { Schema } from "mongoose";

const itemSchema = new Schema ({
    name: String,
    price: Number,
    description: String,
    category: [String],
    technicalDetails: {
        type: Map,
        of: String
    }
});

export const Item = mongoose.model("Item", itemSchema);