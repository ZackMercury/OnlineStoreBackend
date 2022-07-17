import Joi from "joi";
import { JoiId } from "./CommonTypes";

export interface RemoveFavoriteRequest {
    itemID: string;
}

export const removeFavoriteSchema = Joi.object({
    itemID: JoiId
});