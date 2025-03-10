const Joi = require('joi');

const basicDetailsSchema = Joi.object({
  userId: Joi.string().required(), // Required, but won't be updated
  firstName: Joi.string().min(2).max(50),
  lastName: Joi.string().min(2).max(50),
  number: Joi.string().pattern(/^[0-9]{10}$/), // Must be a 10-digit number
  profilePic: Joi.string().uri()
}).or('firstName', 'lastName', 'number', 'profilePic'); // At least one update field is required

module.exports = { basicDetailsSchema };
