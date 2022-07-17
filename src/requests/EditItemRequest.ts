import Joi from "joi";
import { NewItemRequest, newItemSchema } from "./NewItemRequest";

export interface EditItemRequest extends NewItemRequest {
    itemID: string
}

export const editItemSchema = newItemSchema.keys({
    itemID: Joi.string().length(24).regex(/^[0-9a-fA-F]{24}$/).required()
});