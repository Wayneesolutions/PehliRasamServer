const Joi = require("joi");

// Preferences Group Schema Validation
const preferencesGroupSchema = Joi.object({
  name: Joi.string().trim().required().messages({
    "string.empty": "Preferences group name is required",
  }),
});

// Preferences Field Schema Validation
const preferencesFieldSchema = Joi.object({
  label: Joi.string().trim().required().messages({
    "string.empty": "Label is required",
  }),
  profileField: Joi.string().trim().required().messages({
    "string.empty": "Profile field is required",
  }),
  clientTypes: Joi.string().trim().optional().default("General").messages({
    "string.base": "Client type must be a string",
  }),
  weight: Joi.string().valid("Low", "Medium", "High").default("Medium").messages({
    "any.only": "Weight must be 'Low', 'Medium', or 'High'",
  }),
  useInMatch: Joi.boolean().default(false).messages({
    "boolean.base": "UseInMatch must be a boolean",
  }),
  choices: Joi.array().items(Joi.string()).optional().messages({
    "array.base": "Choices must be an array of strings",
  }),
  helpText: Joi.string().trim().optional().allow("").messages({
    "string.base": "Help text must be a string",
  }),
  dealBreak: Joi.boolean().default(false).messages({
    "boolean.base": "DealBreak must be a boolean",
  }),
  preferencesGroupId: Joi.string().trim().required().regex(/^[0-9a-fA-F]{24}$/).messages({
    "string.empty": "Preferences group ID is required",
    "string.pattern.base": "Invalid Preferences Group ID format",
  }),
});


const updatePreferencesFieldSchema = Joi.object({
  fieldId: Joi.string().trim().required().regex(/^[0-9a-fA-F]{24}$/).messages({
    "string.empty": "Field ID is required",
    "string.pattern.base": "Invalid Field ID format",
  }),
  label: Joi.string().trim().optional().messages({
    "string.base": "Label must be a string",
  }),
  profileField: Joi.string().trim().optional().messages({
    "string.base": "Profile field must be a string",
  }),
  clientTypes: Joi.string().trim().optional().messages({
    "string.base": "Client type must be a string",
  }),
  weight: Joi.string().valid("Low", "Medium", "High").optional().messages({
    "any.only": "Weight must be one of ['Low', 'Medium', 'High']",
  }),
  useInMatch: Joi.boolean().optional().messages({
    "boolean.base": "useInMatch must be a boolean",
  }),
  choices: Joi.array().items(Joi.string()).optional().messages({
    "array.base": "Choices must be an array of strings",
  }),
  helpText: Joi.string().trim().optional().allow("").messages({
    "string.base": "Help text must be a string",
  }),
  dealBreak: Joi.boolean().optional().messages({
    "boolean.base": "Deal break must be a boolean",
  }),
  preferencesGroupId: Joi.string().trim().regex(/^[0-9a-fA-F]{24}$/).optional().messages({
    "string.pattern.base": "Invalid Preferences Group ID format",
  }),
  isActive: Joi.boolean().optional().messages({
    "boolean.base": "isActive must be a boolean",
  }),
});

module.exports = { preferencesGroupSchema, preferencesFieldSchema, updatePreferencesFieldSchema };
