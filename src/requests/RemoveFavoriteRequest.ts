import Joi from "joi";

export interface RemoveFavoriteRequest {
    itemID: string;
}

export const removeFavoriteSchema = Joi.object({
    itemID: Joi.string().length(24).regex(/^[0-9a-fA-F]{24}$/).required()
});