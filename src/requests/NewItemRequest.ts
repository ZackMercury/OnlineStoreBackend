import Joi from "joi";

export interface NewItemRequest {
    name: string,
    price: number,
    description: string,
    category: string[],
    technicalDetails: Map<string, string>
}

export const newItemSchema = Joi.object({
    name: Joi.string().trim().min(2).required(),
    price: Joi.number().min(0.01).required(),
    description: Joi.string().trim().min(25).max(5000).required(),
    category: Joi.array().items(Joi.string()),
    technicalDetails: Joi.object().pattern(Joi.string(), Joi.string())
});