const Joi = require('joi');

const permissionFields = {
  Activity: ['Read', 'Agency', 'Import', 'Export', 'View', 'Manage'],
  User: ['Read', 'Create', 'Delete'],
  Automation: ['Read', 'Create', 'Delete'],
  EmailTemplate: ['Read', 'Create', 'Update', 'Delete'],
  Client: ['Read', 'Create', 'Update', 'Delete', 'Assign'],
  Image: ['Read', 'Create', 'Delete'],
  Video: ['Read', 'Create', 'Delete'],
  ClientInvoice: ['Read', 'Create', 'Delete'],
  Contract: ['Read', 'Create', 'Delete', 'Freezing'],
  Event: ['Read', 'Create', 'Delete'],
  File: ['Read', 'Create', 'Delete'],
  Intro: ['Read', 'Create', 'Delete'],
  Match: ['Read', 'Create', 'Delete'],
  Note: ['Read', 'Create', 'Delete'],
  Report: ['Read', 'Create', 'Generate', 'Delete', 'Showcase'],
  Survey: ['Read', 'Create'],
  Task: ['Read', 'Create', 'Update', 'Delete']
};

// Generate dynamic schema
const permissionSchemaObject = {};
for (const category in permissionFields) {
  permissionSchemaObject[category] = Joi.object(
    Object.fromEntries(permissionFields[category].map((field) => [field, Joi.boolean()]))
  );
}

const permissionSchema = Joi.object({
  userId: Joi.string().required(),
  permissions: Joi.object(permissionSchemaObject).required()
});

module.exports = { permissionSchema };
