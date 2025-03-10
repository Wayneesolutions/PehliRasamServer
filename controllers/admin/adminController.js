const mongoose = require('mongoose');
const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const FormGroup = require("../../models/customer/FormGroup")
const FormField = require("../../models/customer/FormField")
const FormFieldsValue = require("../../models/customer/FromFieldValue")
const Customer = require("../../models/customer/customerModel")
const { findMatchingUsers } = require('../../services/matchService');
const Admin = require("../../models/admin/adminModel")
const { notificationSchema } = require('../../validations/notificationValidation');
const { permissionSchema } = require('../../validations/permissionValidation');
const { basicDetailsSchema } = require('../../validations/basicDetailsValidation');
const getImageUrl = require('../../utils/getImageUrl')



exports.create_admin = async (req, res) => {
  try {

    const { fistName, lastName, email, password, permissions, tempTime } = req.body;

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ error: "Admin with this email already exists" });
    }

    // Set default password if not provided
    const plainPassword = password || "123456789";

    // Encrypt password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);

    // Create new admin
    const admin = new Admin({ 
      fistName,
      lastName, 
      email, 
      password: hashedPassword, 
    });

    await admin.save();
    res.status(201).json({ message: "Admin created successfully", admin });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.login_admin = async (req, res) => {
  try {
    // Basic input validation
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Sanitize email
    const sanitizedEmail = email.trim().toLowerCase();

    // Check if admin exists
    const admin = await Admin.findOne({ email: sanitizedEmail, isDeleted: false });
    if (!admin) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // Check if password is correct
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // Check if tempTime has expired (for temporary admins)
    if (admin.tempTime && new Date(admin.tempTime) < new Date()) {
      return res.status(403).json({ error: "Admin access expired" });
    }

    // Update lastLogin field
    admin.lastLogin = new Date();
    await admin.save();

    // Generate JWT Token
    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      process.env.JWT_ACCESS_TOKEN, // Use environment variable for secret key
      { expiresIn: "1h" }
    );

    // Omit sensitive information from the response
    const adminResponse = {
      id: admin._id,
      email: admin.email,
      role: admin.role,
      permissions: admin.permissions,
      notification: admin.notification,
      lastLogin: admin.lastLogin,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt
    };

    res.status(200).json({ message: "Login successful", token, admin: adminResponse });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.updatePermission = async (req, res) => {
  try {
    // Validate request payload
    const { error } = permissionSchema.validate(req.body, { allowUnknown: false });
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { userId, permissions } = req.body;

    // Find the admin
    const admin = await Admin.findById(userId);
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    // Generate update object to update only provided keys
    const updateObject = {};
    for (const category in permissions) {
      for (const field in permissions[category]) {
        updateObject[`permissions.${category}.${field}`] = permissions[category][field];
      }
    }

    // Update only the provided permission keys
    const updatedAdmin = await Admin.findByIdAndUpdate(
      { _id: userId, isDeleted: false },
      { $set: updateObject },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      message: 'Permissions updated successfully',
      permissions: updatedAdmin.permissions,
    });
  } catch (error) {
    console.error('Update permission error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateNotification = async (req, res) => {
  try {
    // Validate request payload
    const { error } = notificationSchema.validate(req.body, { allowUnknown: false });
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { userId, notification } = req.body;

    // Find the admin
    const admin = await Admin.findById(userId);
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    // Generate update object to update only provided keys
    const updateObject = {};
    for (const key in notification) {
      if (notification.hasOwnProperty(key)) {
        updateObject[`notification.${key}`] = notification[key];
      }
    }

    // Update only the provided notification keys
    const updatedAdmin = await Admin.findByIdAndUpdate(
      { _id: userId, isDeleted: false },
      { $set: updateObject },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      message: 'Notifications updated successfully',
      notification: updatedAdmin.notification,
    });
  } catch (error) {
    console.error('Update notification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateBasicDetails = async (req, res) => {
  try {
    const { userId } = req.body; // Extract userId from body
    const authenticatedUserId = req.id; // Extract from token (middleware)

    // Validate request body
    const { error } = basicDetailsSchema.validate(req.body, { allowUnknown: false });
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Ensure users can only update their own details
    if (userId !== authenticatedUserId.toString()) {
      return res.status(403).json({ error: 'Unauthorized: You can only update your own details' });
    }

    // Find the admin
    const admin = await Admin.findById(userId);
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    // Prepare update object (excluding email & userId)
    const updateObject = {};
    ['firstName', 'lastName', 'number'].forEach((key) => {
      if (req.body[key] !== undefined) updateObject[key] = req.body[key];
    });

    // Handle profile picture upload from S3
    if (req.file) {
      // updateObject.profilePic = req.file.location; // S3 URL
      updateObject.profilePic = getImageUrl(req.file.filename); // S3 URL
    }

    console.log("::::::", req.file)

    // Update allowed fields
    const updatedAdmin = await Admin.findByIdAndUpdate(
      { _id: userId, isDeleted: false },
      { $set: updateObject },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      message: 'Basic details updated successfully',
      admin: updatedAdmin,
    });
  } catch (error) {
    console.error('Update basic details error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

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
            preferredAgeRange: {
                min: statucVlaue[1].matchPreferences?.preferredAgeRange.min || 'NAN',
                max: statucVlaue[1].matchPreferences?.preferredAgeRange.max || 'NAN',
            },
            preferredHeight: {
              min: statucVlaue[1].matchPreferences?.preferredHeight.min || 'NAN',
              max: statucVlaue[1].matchPreferences?.preferredHeight.max || 'NAN'
            },
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
    console.log("staticField:::::", staticField.statucVlaue)

    // return true;
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

exports.updateCustomer = async (req, res) => {
  try {
      const { customerId } = req.params;
      const { statucVlaue, dyanmicValue } = req.body;

      if (!customerId) {
          return res.status(400).json({
              success: false,
              message: 'Customer ID is required'
          });
      }

      const customer = await Customer.findById(customerId);
      if (!customer) {
          return res.status(404).json({
              success: false,
              message: 'Customer not found'
          });
      }

      // Update static fields if provided
      if (statucVlaue && Array.isArray(statucVlaue)) {
          const personalDetails = statucVlaue.find(item => item.personalDetails)?.personalDetails || {};
          const matchPreferences = statucVlaue.find(item => item.matchPreferences)?.matchPreferences || {};

          // Merge provided data with existing data (keep existing if not provided)
          customer.personalDetails.fullName = personalDetails.fullName ?? customer.personalDetails.fullName;
          customer.personalDetails.email = personalDetails.email ?? customer.personalDetails.email;
          customer.personalDetails.contactNumber = personalDetails.contactNumber ?? customer.personalDetails.contactNumber;
          customer.personalDetails.country = personalDetails.country ?? customer.personalDetails.country;
          customer.personalDetails.location = personalDetails.location ?? customer.personalDetails.location;

          customer.matchPreferences.preferredGender = matchPreferences.preferredGender ?? customer.matchPreferences.preferredGender;
          customer.matchPreferences.preferredReligion = matchPreferences.preferredReligion ?? customer.matchPreferences.preferredReligion;
          customer.matchPreferences.preferredAgeRange = {
              min: matchPreferences.preferredAgeRange?.min ?? customer.matchPreferences.preferredAgeRange.min,
              max: matchPreferences.preferredAgeRange?.max ?? customer.matchPreferences.preferredAgeRange.max,
          };
          customer.matchPreferences.preferredHeight = {
              min: matchPreferences.preferredHeight?.min ?? customer.matchPreferences.preferredHeight.min,
              max: matchPreferences.preferredHeight?.max ?? customer.matchPreferences.preferredHeight.max
          };
          customer.matchPreferences.caste = matchPreferences.caste ?? customer.matchPreferences.caste;
          customer.matchPreferences.cityPreferred = matchPreferences.cityPreferred ?? customer.matchPreferences.cityPreferred;
          customer.matchPreferences.preferredAppearance = matchPreferences.preferredAppearance ?? customer.matchPreferences.preferredAppearance;
          customer.matchPreferences.maritalStatusPreference = matchPreferences.maritalStatusPreference ?? customer.matchPreferences.maritalStatusPreference;
          customer.matchPreferences.educationPreference = matchPreferences.educationPreference ?? customer.matchPreferences.educationPreference;
          customer.matchPreferences.employmentPreference = matchPreferences.employmentPreference ?? customer.matchPreferences.employmentPreference;
          customer.matchPreferences.vegetarianPreference = matchPreferences.vegetarianPreference ?? customer.matchPreferences.vegetarianPreference;
          customer.matchPreferences.drinkAlcohol = matchPreferences.drinkAlcohol ?? customer.matchPreferences.drinkAlcohol;

          await customer.save();
      }

      // Update dynamic fields if provided
      if (dyanmicValue && Array.isArray(dyanmicValue) && dyanmicValue.length > 0) {
          // Remove old fields for this customer (optional: if you want to replace all fields)
          await FormFieldsValue.deleteMany({ customeId: customerId });

          const insertData = [];

          for (const group of dyanmicValue) {
              const { groupId, groupFields } = group;

              if (!groupId || !groupFields || !Array.isArray(groupFields)) {
                  return res.status(400).json({
                      success: false,
                      message: 'Invalid group structure in dynamicValue'
                  });
              }

              for (const field of groupFields) {
                  const { filedID, filedValue } = field;

                  insertData.push({
                      groupId: new mongoose.Types.ObjectId(groupId),
                      fieldId: new mongoose.Types.ObjectId(filedID),
                      value: filedValue,
                      customeId: new mongoose.Types.ObjectId(customerId)
                  });
              }
          }

          await FormFieldsValue.insertMany(insertData);
      }

      res.status(200).json({
          success: true,
          message: 'Customer updated successfully',
          updatedCustomer: customer
      });

  } catch (error) {
      console.error('Error updating customer:', error.message);
      res.status(500).json({
          success: false,
          message: 'Failed to update customer',
          error: error.message
      });
  }
};

exports.reactivateCustomer = async (req, res) => {
  try {
      const { customerId } = req.body;

      if (!customerId) {
          return res.status(400).json({
              success: false,
              message: 'Customer ID is required in the request body'
          });
      }

      const customer = await Customer.findById(customerId);

      if (!customer) {
          return res.status(404).json({
              success: false,
              message: 'Customer not found'
          });
      }

      if (!customer.isDeleted) {
          return res.status(400).json({
              success: false,
              message: 'Customer is already active'
          });
      }

      customer.isDeleted = false;
      await customer.save();

      res.status(200).json({
          success: true,
          message: 'Customer reactivated successfully',
          customer
      });

  } catch (error) {
      console.error('Error reactivating customer:', error.message);
      res.status(500).json({
          success: false,
          message: 'Failed to reactivate customer',
          error: error.message
      });
  }
};