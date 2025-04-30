const Joi = require('joi');

const basicDetailsSchema = Joi.object({
  userId: Joi.string().required(), // Required, but won't be updated
  firstName: Joi.string().min(2).max(50),
  lastName: Joi.string().min(2).max(50),
  number: Joi.string().pattern(/^[0-9]{10}$/), // Must be a 10-digit number
  profilePic: Joi.string().uri(),
  password: Joi.string().min(6).max(1024) // Add password validation
}).or('firstName', 'lastName', 'number', 'profilePic', 'password'); // Ensure at least one field is updated

module.exports = { basicDetailsSchema };
