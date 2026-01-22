const Joi = require('joi');

const updateCustomerSchema = Joi.object({
    customerId: Joi.string().optional(),
    entryName: Joi.string().max(100).trim().allow(null, ''), // Optional entry name
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
        state: Joi.string().trim().allow(null, ''),
        country: Joi.string().optional(),
        postalCode: Joi.string().trim().allow(null, '')
    }).allow(null),
});

module.exports = { updateCustomerSchema };
