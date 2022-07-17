import Joi from "joi"

export const JoiId = Joi.string().length(24).regex(/^[0-9a-fA-F]{24}$/).required();