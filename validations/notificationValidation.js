const Joi = require('joi');

const notificationFields = [
  'newSubmittedClient',
  'systemMessage',
  'mentions',
  'newTaskAssigned',
  'birthdayReminder',
  'clientProfileUpdate',
  'systemError',
  'incomingTextMessage',
  'reminder'
];

// Define base schema
const baseNotificationSchema = Joi.object({
  email: Joi.boolean(),
  sms: Joi.boolean(),
  web: Joi.boolean(),
});

// Create dynamic schema
const dynamicNotificationSchema = Joi.object().pattern(
  Joi.string().valid(...notificationFields),
  baseNotificationSchema
);

// Main validation schema
const notificationSchema = Joi.object({
  userId: Joi.string().required(), // Ensure userId is provided
  notification: dynamicNotificationSchema.required(),
});

module.exports = { notificationSchema };
