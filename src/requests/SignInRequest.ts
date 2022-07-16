import Joi from "joi";

export interface SignInRequest {
    login: string;
    password: string; 
}

export const signInSchema = Joi.object().keys({
    login: Joi.string().trim().min(2).max(30).required(),
    password: Joi.string().min(5).required()
});