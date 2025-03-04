const { body } = require("express-validator");

const validateFormField = [
  body("attributeName")
    .trim()
    .notEmpty()
    .withMessage("Attribute name is required"),

  body("attributeType")
    .trim()
    .notEmpty()
    .withMessage("Attribute type is required")
    .isString()
    .withMessage("Attribute type must be a string"),

  body("attributeState")
    .trim()
    .notEmpty()
    .withMessage("Attribute state is required")
    .isString()
    .withMessage("Attribute state must be a string"),

  body("attributePlaceHolder")
    .optional()
    .isString()
    .withMessage("Placeholder must be a string"),

  body("attributeEnum")
    .optional()
    .isArray()
    .withMessage("Attribute Enum must be an array"),

  body("attributeOption")
    .optional()
    .isArray()
    .withMessage("Attribute Option must be an array"),

  body("form_group_id")
    .trim()
    .notEmpty()
    .withMessage("Form group ID is required")
    .isMongoId()
    .withMessage("Invalid Form Group ID"),
];

const validateFormGroup = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Form group name is required")
    .isString()
    .withMessage("Form group name must be a string"),
];


module.exports = { validateFormField, validateFormGroup };
