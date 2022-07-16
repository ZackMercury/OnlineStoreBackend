import Joi from "joi";

export interface SignUpRequest {
    email: string;
    login: string;
    password: string; 
    phone: string;
    firstname: string;
    lastname: string;
    address: string;
}

export const signUpSchema = Joi.object().keys({
    email: Joi.string().trim().lowercase().email().required(),
    login: Joi.string().trim().min(2).max(30).required(),
    password: Joi.string().min(5).required(),
    phone: Joi.string().min(5).max(16).required(),
    firstname: Joi.string().trim().min(2).max(30).required(),
    lastname: Joi.string().trim().min(3).max(30).required(),
    address: Joi.string().trim().min(10).required()
});