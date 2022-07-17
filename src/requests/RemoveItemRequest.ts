import Joi from "joi";

export interface RemoveItemRequest {
    itemID: string;
}

export const removeItemSchema = Joi.object({
    itemID: Joi.string().length(24).regex(/^[0-9a-fA-F]{24}$/).required()
});