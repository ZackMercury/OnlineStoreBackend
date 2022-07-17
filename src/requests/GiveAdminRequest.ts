import Joi from "joi";
import { JoiId } from "./CommonTypes";

export interface GiveAdminRequest {
    userID: string;
}

export const giveAdminSchema = Joi.object({
    userID: JoiId
});