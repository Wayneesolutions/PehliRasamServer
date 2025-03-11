const Joi = require("joi");

const formFieldSchema = Joi.object({
  attributeName: Joi.string().trim().required().messages({
    "string.empty": "Attribute name is required",
  }),
  attributeType: Joi.string().trim().required().messages({
    "string.empty": "Attribute type is required",
  }),
  attributeState: Joi.string().trim().required().messages({
    "string.empty": "Attribute state is required",
  }),
  attributePlaceHolder: Joi.string().trim().optional().messages({
    "string.base": "Placeholder must be a string",
  }),
  attributeEnum: Joi.array().items(Joi.string()).optional().messages({
    "array.base": "Attribute Enum must be an array",
  }),
  attributeOption: Joi.array().items(Joi.string()).optional().messages({
    "array.base": "Attribute Option must be an array",
  }),
  form_group_id: Joi.string().trim().required().regex(/^[0-9a-fA-F]{24}$/).messages({
    "string.empty": "Form group ID is required",
    "string.pattern.base": "Invalid Form Group ID",
  }),
});

const formGroupSchema = Joi.object({
  name: Joi.string().trim().required().messages({
    "string.empty": "Form group name is required",
  }),
});

module.exports = { formFieldSchema, formGroupSchema };
