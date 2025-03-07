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

exports.getAllFieldsList = async (req, res) =>{
  try {

    const staticField = await Object.keys(Customer.schema.paths);

    const dynamicField = await FormField.aggregate([
      {
        $lookup: {
          from: "formgroups", // This should match your actual collection name in MongoDB
          localField: "form_group_id",
          foreignField: "_id",
          as: "formGroup"
        }
      },
      {
        $unwind: "$formGroup"
      },
      {
        $group: {
          _id: "$form_group_id",
          groupName: { $first: "$formGroup.name" },
          fields: {
            $push: {
              attributeId: "$_id",
              attributeName: "$attributeName",
              attributeType: "$attributeType",
              attributeState: "$attributeState",
            }
          }
        }
      },
      {
        $sort: { "groupName": 1 } // Sort by group name (optional)
      }
    ]);


    res.status(200).json({
      success: true,
      result: {
          staticField,
          dynamicField
      }
  });

    
} catch (error) {
  console.error('Error fetching fields list:', error.message);

  res.status(500).json({
      success: false,
      message: 'Failed to fetch fields list',
      error: error.message
  });
}
};

exports.addCustomer = async (req, res) =>{
  try {
    // const data = req.body;
    const { statucVlaue, dyanmicValue } = req.body;

    if (!statucVlaue || !dyanmicValue) {
      return res.status(400).json({
          success: false,
          message: 'Both statucVlaue and dyanmicValue are required'
      });
    }

    const personalDetails = statucVlaue.find(item => item.personalDetails)?.personalDetails;
    const matchPreferences = statucVlaue.find(item => item.matchPreferences)?.matchPreferences;

    if (!personalDetails || !matchPreferences) {
        return res.status(400).json({
            success: false,
            message: 'Both personalDetails and matchPreferences are required inside statucVlaue'
        });
    }

    const staticField = {
        personalDetails: {
            fullName: statucVlaue[0].personalDetails?.fullName || 'NAN',
            email: statucVlaue[0].personalDetails?.email || 'NAN',
            contactNumber: statucVlaue[0].personalDetails?.contactNumber || 'NAN',
            country: statucVlaue[0].personalDetails?.country || 'NAN',
            location: statucVlaue[0].personalDetails?.location || 'NAN'
        },
        matchPreferences: {
            preferredGender: statucVlaue[1].matchPreferences?.preferredGender || 'NAN',
            preferredReligion: statucVlaue[1].matchPreferences?.preferredReligion || 'NAN',
            // preferredAgeRange: statucVlaue[0].matchPreferences?.preferredAgeRange || 'NAN',
            // preferredHeight: statucVlaue[0].matchPreferences?.preferredHeight || 'NAN',
            caste: statucVlaue[1].matchPreferences?.caste || 'NAN',
            cityPreferred: statucVlaue[1].matchPreferences?.cityPreferred || 'NAN',
            preferredAppearance: statucVlaue[1].matchPreferences?.preferredAppearance || 'NAN',
            maritalStatusPreference: statucVlaue[1].matchPreferences?.maritalStatusPreference || 'NAN',
            educationPreference: statucVlaue[1].matchPreferences?.educationPreference || 'NAN',
            employmentPreference: statucVlaue[1].matchPreferences?.employmentPreference || 'NAN',
            vegetarianPreference: statucVlaue[1].matchPreferences?.vegetarianPreference ?? false,
            drinkAlcohol: statucVlaue[1].matchPreferences?.drinkAlcohol ?? false
        }
    };
    // console.log("statucVlaue:::::", statucVlaue[1])
    const existingProfile = await Customer.findOne({ 'personalDetails.email': staticField.personalDetails.email });

    if (existingProfile) {
        return res.status(400).json({ error: 'Email already exists. Please use a different email.' });
    }

    const customer = new Customer(staticField);
    const inserCustomeBesicDetail = await customer.save();
    const customerId = inserCustomeBesicDetail._id

    console.log("customerID::::", customerId)


    if (!customerId) {
      return res.status(400).json({
          success: false,
          message: 'Customer ID is required'
      });
    }

    if (!dyanmicValue || !Array.isArray(dyanmicValue) || dyanmicValue.length === 0) {
      return res.status(400).json({
          success: false,
          message: 'Invalid or empty dynamicValue array'
      });
    }

    const insertData = [];

    // Loop through each group
    for (const group of dyanmicValue) {
        const { groupId, groupFields } = group;

        if (!groupId || !groupFields || !Array.isArray(groupFields)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid group structure in dynamicValue'
            });
        }

        // Loop through each field in the group
        for (const field of groupFields) {
            const { filedID, filedValue } = field;

            insertData.push({
                groupId: new mongoose.Types.ObjectId(groupId),    // Converting to ObjectId
                fieldId: new mongoose.Types.ObjectId(filedID),    // Converting to ObjectId
                value: filedValue,
                customeId: new mongoose.Types.ObjectId(customerId) // Converting to ObjectId
            });
        }
    }

    // Bulk Insert to MongoDB
    await FormFieldsValue.insertMany(insertData);
    
    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      // dataCount: insertData.length
  });
  } catch (error) {
    console.error('Error fetching fields list:', error.message);

  res.status(500).json({
      success: false,
      message: 'Failed to fetch fields list',
      error: error.message
  });
  }
}