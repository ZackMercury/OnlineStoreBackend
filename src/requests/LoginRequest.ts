import Joi from "joi";

export interface LoginRequest {
    login: string;
    password: string; 
}

export const loginSchema = Joi.object().keys({
    login: Joi.string().trim().min(2).max(30).required(),
    password: Joi.string().min(5).required()
});