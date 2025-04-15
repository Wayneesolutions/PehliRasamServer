const Joi = require('joi');

const updateCustomerSchema = Joi.object({
    customerId: Joi.string().optional(),
    firstName: Joi.string().min(3).max(50).trim(),
    middelName: Joi.string().min(3).max(50).trim().allow(null, ''), // Optional
    lastName: Joi.string().min(3).max(50).trim(),
    email: Joi.string().trim().email().lowercase(),
    Number: Joi.string().optional(),
    activeStatus: Joi.boolean(),
    imagePath: Joi.string().trim().uri().allow(null, ''), // URL validation
    address: Joi.object({
        street: Joi.string().trim().allow(null, ''),
        city: Joi.string().trim().allow(null, ''),
        stateOrProvince: Joi.string().trim().allow(null, ''),
        country: Joi.string().trim().regex(/^[A-Z]{2,3}$/).message("Invalid country code"),
        postalCode: Joi.string().trim().allow(null, '')
    }).allow(null),
});

module.exports = { updateCustomerSchema };
