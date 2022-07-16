import Joi from "joi";
import { Types } from "mongoose";

export interface AddFavoriteRequest {
    itemID: string;
}

export const addFavoriteSchema = Joi.object({
    itemID: Joi.string().length(24).regex(/^[0-9a-fA-F]{24}$/).required()
});