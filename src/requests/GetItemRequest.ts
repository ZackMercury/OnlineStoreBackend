import Joi, { string } from "joi";

export interface GetItemRequest {
    itemID: string;
}

export const getItemSchema = Joi.object({
    itemID: Joi.string().length(24).regex(/^[0-9a-fA-F]{24}$/).required()
});