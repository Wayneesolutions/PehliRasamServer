const mongoose = require('mongoose');
const { validationResult } = require("express-validator");
const FormGroup = require("../../models/customer/FormGroup")
const FormField = require("../../models/customer/FormField")
const FormFieldsValue = require("../../models/customer/FromFieldValue")
const Customer = require("../../models/customer/customerModel")
const { findMatchingUsers } = require('../../services/matchService');


exports.form_group = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name } = req.body;

    const existingGroup = await FormGroup.findOne({ name });
    if (existingGroup) {
      return res.status(400).json({ error: "A form group with this name already exists" });
    }

    const formGroup = new FormGroup({ name });
    await formGroup.save();
    res.status(201).json(formGroup);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.form_field = async (req, res) => {
try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { attributeName, attributeType, attributeState, attributePlaceHolder, attributeEnum, attributeOption, form_group_id } = req.body;

    const formGroup = await FormGroup.findById(form_group_id);
    if (!formGroup) {
      return res.status(404).json({ error: "Form Group not found" });
    }

    const existingField = await FormField.findOne({ form_group_id, attributeName });
    if (existingField) {
      return res.status(400).json({ error: "A field with this attributeName already exists in the form group" });
    }

    const formField = new FormField({
    attributeName,
    attributeType,
    attributeState,
    attributePlaceHolder,
    attributeEnum,
    attributeOption,
    form_group_id,
    });

    await formField.save();

    // Add the form field to the form group
//   formGroup.formFields.push(formField._id);
//   await formGroup.save();

    res.status(201).json(formField);
} catch (error) {
    res.status(500).json({ error: error.message });
}
}

exports.form_group_List = async (req, res) => {
  try {
    const formGroups = await FormGroup.aggregate([
      // {
      //     $match: { _id: new mongoose.Types.ObjectId(groupId) } 
      // },
      {
          $lookup: {
              from: "formfields",   // The collection name in MongoDB (lowercase + plural by default)
              localField: "_id",
              foreignField: "form_group_id",
              as: "formFields"
          }
      }
  ]);
    res.status(200).json(formGroups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

exports.getRecentlySubmittedClients = async (req, res) => {
  try {
      const clients = await Customer.aggregate([
          { $sort: { createdAt: -1 } },
          { $limit: 10 }
      ]);
      res.json(clients);
  } catch (error) {
      res.status(500).json({ message: 'Error fetching recently submitted clients', error: error.message });
  }
};

exports.getClientSubmissions = async (req, res) => {
    try {
        const count = await Customer.countDocuments();
        res.json({ totalSubmissions: count });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching client submissions count', error: error.message });
    }
};

exports.getClientsAddedToday = async (req, res) => {
    try {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);

        const count = await Customer.countDocuments({
            createdAt: { $gte: startOfToday, $lte: endOfToday }
        });

        res.json({ clientsAddedToday: count });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching today\'s clients', error: error.message });
    }
};

exports.getMatchingUsers = async (req, res) => {
  try {
      const {customerId} = req.body;
      const matches = await findMatchingUsers(customerId);
      res.json({ matches });
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
};

exports.getCustomerProfile = async (req, res) => {
  try {
      const {customerId} = req.body;
      const customerObjectId = new mongoose.Types.ObjectId(customerId);

      const customer = await Customer.aggregate([
          {
              $match: { _id: customerObjectId }
          },
          {
              $lookup: {
                  from: "formfieldsvalues",
                  localField: "_id",
                  foreignField: "customeId",
                  as: "formFields"
              }
          },
          {
              $lookup: {
                  from: "formgroups",
                  localField: "formFields.groupId",
                  foreignField: "_id",
                  as: "groups"
              }
          },
          {
              $lookup: {
                  from: "formfields",
                  localField: "formFields.fieldId",
                  foreignField: "_id",
                  as: "fields"
              }
          },
          {
              $project: {
                  personalDetails: 1,
                  matchPreferences: 1,
                  dynamicFields: {
                      $map: {
                          input: "$groups",
                          as: "group",
                          in: {
                              groupId: "$$group._id",
                              groupName: "$$group.name",
                              fields: {
                                  $map: {
                                      input: {
                                          $filter: {
                                              input: "$formFields",
                                              as: "ff",
                                              cond: { $eq: ["$$ff.groupId", "$$group._id"] }
                                          }
                                      },
                                      as: "ff",
                                      in: {
                                          fieldId: "$$ff.fieldId",
                                          value: "$$ff.value",
                                          fieldDetails: {
                                              $arrayElemAt: [
                                                  {
                                                      $filter: {
                                                          input: "$fields",
                                                          as: "field",
                                                          cond: { $eq: ["$$field._id", "$$ff.fieldId"] }
                                                      }
                                                  },
                                                  0
                                              ]
                                          }
                                      }
                                  }
                              }
                          }
                      }
                  }
              }
          },
          {
              $project: {
                  personalDetails: 1,
                  matchPreferences: 1,
                  dynamicFields: {
                      $map: {
                          input: "$dynamicFields",
                          as: "group",
                          in: {
                              groupId: "$$group.groupId",
                              groupName: "$$group.groupName",
                              fields: {
                                  $map: {
                                      input: "$$group.fields",
                                      as: "field",
                                      in: {
                                          fieldId: "$$field.fieldId",
                                          fieldName: "$$field.fieldDetails.attributeName",
                                          value: "$$field.value"
                                      }
                                  }
                              }
                          }
                      }
                  }
              }
          }
      ]);
      res.status(201).json({
        message: "Customer details",
        data: customer
    });
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
};