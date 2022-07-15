import Joi from "joi";

export interface RegisterRequest {
    email: string;
    login: string;
    password: string; 
}

export const registerSchema = Joi.object().keys({
    email: Joi.string().trim().lowercase().email().required(),
    login: Joi.string().min(2).max(30).trim().required(),
    password: Joi.string().min(5).required()
});