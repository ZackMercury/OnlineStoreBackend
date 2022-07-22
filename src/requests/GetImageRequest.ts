import Joi from "joi";
import { JoiId } from "./CommonTypes";

export interface GetImageRequest {
    itemID: string;
}

export const getImageSchema = Joi.object({
    itemID: JoiId
});