import Joi, { string } from "joi";
import { JoiId } from "./CommonTypes";

export interface GetItemRequest {
    itemID: string;
}

export const getItemSchema = Joi.object({
    itemID: JoiId
});