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
    login: Joi.string().min(2).max(30).trim().required(),
    password: Joi.string().min(5).required(),
    phone: Joi.string().min(5).max(16).required(),
    firstname: Joi.string().min(2).max(30).trim().required(),
    lastname: Joi.string().min(3).max(30).trim().required(),
    address: Joi.string().min(10).trim().required()
});