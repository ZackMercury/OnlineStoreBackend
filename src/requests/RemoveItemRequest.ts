import Joi from "joi";
import { JoiId } from "./CommonTypes";

export interface RemoveItemRequest {
    itemID: string;
}

export const removeItemSchema = Joi.object({
    itemID: JoiId
});