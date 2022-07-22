import Joi, { string } from "joi";
import { JoiId } from "./CommonTypes";

export interface GetItemsRequest {
    sortBy?: string;
    sort?: "asc" | "desc" | "";
    perPage: number;
    page: number;
    items?: string[];
    filter?: {
        priceMin?: number;
        priceMax?: number;
        searchQuery?: string;
        category?: string[];
    }  
}

export const getItemsSchema = Joi.object({
    items: Joi.array().items(JoiId),
    sortBy: Joi.string().default("id"),
    sort: Joi.string().valid("asc", "desc", "").default(""),
    category: Joi.array().items(Joi.string()).default([]),
    perPage: Joi.number().required(),
    page: Joi.number().required(),
    filter: Joi.object({
        priceMin: Joi.number().min(0.01),
        priceMax: Joi.number().min(0.01),
        searchQuery: Joi.string(),
        category: Joi.array().items(Joi.string())
    })
});