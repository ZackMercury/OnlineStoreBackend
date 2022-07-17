import Joi from "joi";
import { JoiId } from "./CommonTypes";
import { NewItemRequest, newItemSchema } from "./NewItemRequest";

export interface EditItemRequest extends NewItemRequest {
    itemID: string
}

export const editItemSchema = newItemSchema.keys({
    itemID: JoiId
});