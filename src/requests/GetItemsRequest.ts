import Joi, { string } from "joi";

export interface GetItemsRequest {
    sortBy: string;
    sort: "asc" | "desc";
    category: string[];
    perPage: number;
    page: number;
}

export const getItemsSchema = Joi.object({
    sortBy: Joi.string().default("id"),
    sort: Joi.string().valid("asc", "desc").default("asc"),
    category: Joi.array().items(Joi.string()).default([]),
    perPage: Joi.number().required(),
    page: Joi.number().required()
});