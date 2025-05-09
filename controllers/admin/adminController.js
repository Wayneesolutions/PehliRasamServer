const mongoose = require('mongoose');
const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");
const moment = require('moment');
const fs = require('fs');
const FormGroup = require("../../models/customer/clientAttributes/FormGroup")
const FormField = require("../../models/customer/clientAttributes/FormField")
const FormFieldsValue = require("../../models/customer/clientAttributes/FromFieldValue")
const Customer = require("../../models/customer/customerModel")
const { findMatchingUsers } = require('../../services/azureBlobService');
const Admin = require("../../models/admin/adminModel");
const FieldType = require("../../models/customer/clientAttributes/fieldType");
const ClientList = require("../../models/customer/clientList");
const { notificationSchema } = require('../../validations/notificationValidation');
const { permissionSchema } = require('../../validations/permissionValidation');
const { basicDetailsSchema } = require('../../validations/basicDetailsValidation');
const { formFieldSchema, formGroupSchema } = require("../../validations/formValidation");
const { updateCustomerSchema } = require("../../validations/customerValidation");
const uploadToAzure = require("../../services/azureBlobService");
const getImageUrl = require('../../utils/getImageUrl');
const SubmissionForm = require("../../models/customer/submissionForm/submissionForm");
const PreferencesGroup = require("../../models/customer/preferencesAttributes/preferencesGroup");
const PreferencesFields = require("../../models/customer/preferencesAttributes/preferencesFields");
const PreferencesFieldsValue = require("../../models/customer/preferencesAttributes/preferencesFieldsValue");
const { preferencesGroupSchema, preferencesFieldSchema, updatePreferencesFieldSchema } = require("../../validations/preferencesValidation");
const MatchGroup = require("../../models/customer/matchGroupsAttributes/matchGroupsModel");
const MatchGroupValue = require("../../models/customer/matchGroupsAttributes/matchGroupsValueModel");
const EmailTemplate = require('../../models/customer/mail/emailTemplate');
const MailLog = require('../../models/customer/mail/mailLog');
const sendEmail = require('../../utils/sendEmail');
const ActivityLog = require("../../models/customer/activityLog");
const Preset = require("../../models/customer/Presets/preset");
const PresetFields = require('../../models/customer/Presets/presetFields');
const Intro = require("../../models/customer/intro/intro");
const IntroFields = require("../../models/customer/intro/introFields");




//Admin related section---
exports.create_admin = async (req, res) => {
  try {

    const { firstName, lastName, email, password, permissions, tempTime } = req.body;

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
      firstName,
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
      { expiresIn: "7d" }
    );

    // Omit sensitive information from the response
    const adminResponse = {
      id: admin._id,
      firstName: admin.firstName,
      lastName: admin.lastName,
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
    const { userId, password } = req.body;
    const authenticatedUserId = req.id;

    const { error } = basicDetailsSchema.validate(req.body, { allowUnknown: false });
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    if (userId !== authenticatedUserId.toString()) {
      return res.status(403).json({ error: 'Unauthorized: You can only update your own details' });
    }

    const admin = await Admin.findById(userId);
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    const updateObject = {};
    ['firstName', 'lastName', 'number'].forEach((key) => {
      if (req.body[key] !== undefined) updateObject[key] = req.body[key];
    });

    if (req.file) {
      updateObject.profilePic = getImageUrl(req.file.filename);
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateObject.password = hashedPassword;
    }

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

exports.getAdminDetail = async (req, res) => {
  try {

      const { userId } = req.body;

      if (!userId) {
          return res.status(400).json({ message: "Admin ID is required" });
      }

      const admin = await Admin.findById({_id: userId, isDeleted: false}).select("-password"); // Exclude password for security

      if (!admin) {
          return res.status(404).json({ message: "Admin not found" });
      }
    
    res.status(200).json({ message: "Admin Detail", admin: admin });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getAdminList = async (req, res) => {
  try {
    const admins = await Admin.find({isDeleted: false}).select("-password"); // Exclude passwords for security

    if (!admins.length) {
        return res.status(404).json({ message: "No admins found" });
    }

    res.status(200).json({ message: "Admin Detail", admin: admins });

    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
}

exports.deactiveAdmin = async (req, res) => {
  try {
    const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ message: "Admin ID is required" });
        }

        const admin = await Admin.findById({_id: userId});

        if (!admin) {
            return res.status(404).json({ message: "Admin not found" });
        }

        // Update admin status to inactive
        admin.isDeleted = true;
        await admin.save();

        res.status(200).json({ success: true, message: "Admin deleted successfully", admin });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
}

//Group and fileds section---
exports.createFromGroup = async (req, res) => {
  try {
    const { error } = formGroupSchema.validate(req.body, { allowUnknown: false });
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { name } = req.body;
    const createdBy = req.id;

    const existingGroup = await FormGroup.findOne({ name });
    if (existingGroup) {
      return res.status(400).json({ error: "A form group with this name already exists" });
    }

    const formGroup = new FormGroup({ name, createdBy });
    await formGroup.save();
    res.status(201).json(formGroup);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateFromGroup = async (req, res) => {
  try {
    const { groupId, name } = req.body;
    const editedBy = req.id;

    if (!groupId) {
        return res.status(400).json({ message: "FormGroup ID is required" });
    }

    const formGroup = await FormGroup.findOne({ _id: groupId, isDeleted: false });

    if (!formGroup) {
        return res.status(404).json({ message: "FormGroup not found" });
    }

    // Update fields if provided
    if (name) formGroup.name = name;
    // if (typeof isActive === "boolean") formGroup.isActive = isActive;
    if (editedBy) formGroup.editedBy = editedBy;

    await formGroup.save();

    res.status(200).json({ success: true, message: "FormGroup updated successfully", formGroup });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteFromGroup = async (req, res) => {
  try {
    const { groupId } = req.body;
    const editedBy = req.id;

    if (!groupId) {
        return res.status(400).json({ message: "FormGroup ID is required" });
    }

    const formGroup = await FormGroup.findOne({ _id: groupId, isDeleted: false });


    if (!formGroup) {
        return res.status(404).json({ message: "FormGroup not found" });
    }

    // Update fields if provided
    // if (typeof isActive === "boolean") formGroup.isActive = isActive;
    if (editedBy) formGroup.editedBy = editedBy;
    if (groupId) formGroup.isDeleted = true;

    await formGroup.save();

    res.status(200).json({ success: true, message: "FormGroup updated successfully", formGroup });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getFromGroupList = async (req, res) => {
  try {

    const formGroup = await FormGroup.find({isDeleted: false});

    if (!formGroup) {
        return res.status(404).json({ message: "FormGroup not found" });
    }

    res.status(200).json({ success: true, message: "FormGroup list", formGroup });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createFromField = async (req, res) => {
try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const createdBy = req.id;
    const { attributeName, attributeType, attributeStatus, attributePlaceHolder, attributeEnum, attributeOption, form_group_id } = req.body;

    const formGroup = await FormGroup.findOne({ _id: form_group_id, isDeleted: false });
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
    attributeStatus,
    attributePlaceHolder,
    attributeEnum,
    attributeOption,
    form_group_id,
    createdBy
    });

    await formField.save();

    // Add the form field to the form group
//   formGroup.formFields.push(formField._id);
//   await formGroup.save();

    res.status(201).json({ 
      message: "Form field created successfully.",
      formField 
    });
} catch (error) {
    res.status(500).json({ error: error.message });
}
}

exports.updateFormField = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const editedBy = req.id;
    const { fieldId, ...updateData } = req.body; // Extract fieldId and remaining fields

    if (!fieldId) {
      return res.status(400).json({ error: "Field ID is required" });
    }

    const formField = await FormField.findOne({ _id: fieldId });

    if (!formField) {
      return res.status(404).json({ error: "Form field not found" });
    }

    // Update only the provided fields
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] !== undefined) {
        formField[key] = updateData[key];
      }
    });

    formField.editedBy = editedBy;

    await formField.save();

    res.status(200).json({
      message: "Form field updated successfully.",
      formField,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.changeFormFieldGroup = async (req, res) => {
  try {

    const editedBy = req.id;
    const { fieldId, formGroupId } = req.body; // Only extract fieldId and new group ID

    if (!fieldId || !formGroupId) {
      return res.status(400).json({ error: "Field ID and new Form Group ID are required" });
    }

    // Check if the new form group exists and is not deleted
    const formGroup = await FormGroup.findOne({ _id: formGroupId, isDeleted: false });
    if (!formGroup) {
      return res.status(404).json({ error: "Target Form Group not found or deleted" });
    }

    const formField = await FormField.findOne({ _id: fieldId });

    if (!formField) {
      return res.status(404).json({ error: "Form field not found" });
    }

    // Update only the form_group_id
    formField.form_group_id = formGroupId;
    formField.editedBy = editedBy;

    await formField.save();

    res.status(200).json({
      message: "Form field group updated successfully.",
      formField,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteFormField = async (req, res) => {
  try {
    const { fieldId } = req.body; // Get the field ID from request body
    const editedBy = req.id; // Track who is deleting

    if (!fieldId) {
      return res.status(400).json({ error: "Field ID is required" });
    }

    const formField = await FormField.findOne({ _id: fieldId });

    if (!formField) {
      return res.status(404).json({ error: "Form field not found" });
    }

    // Mark as deleted instead of removing
    formField.isDeleted = true;
    formField.editedBy = editedBy;

    await formField.save();

    res.status(200).json({
      message: "Form field deleted successfully.",
      formField,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.allGroupFieldList = async (req, res) => {
  try {
    const groupFieldList = await FormGroup.aggregate([
      {
        $match: { isDeleted: false }
      },
      {
        $lookup: {
          from: "formfields",
          localField: "_id",
          foreignField: "form_group_id",
          as: "fields"
        }
      },
      {
        $unwind: {
          path: "$fields",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $match: {
          $or: [
            { "fields.isDeleted": { $exists: false } }, // not present
            { "fields.isDeleted": false } // explicitly false
          ]
        }
      },
      {
        $group: {
          _id: "$_id",
          groupName: { $first: "$name" },
          fields: {
            $push: {
              attributeId: "$fields._id",
              attributeName: "$fields.attributeName",
              attributeType: "$fields.attributeType",
              attributeStatus: "$fields.attributeState",
              attributeEnum: "$fields.attributeEnum",
              attributeOption: "$fields.attributeOption"
            }
          }
        }
      },
      {
        $sort: { "groupName": 1 }
      }
    ]);

    res.status(200).json({
      success: true,
      message: "Form groups with their fields retrieved successfully.",
      data: groupFieldList
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "An error occurred while retrieving form groups and fields.",
      error: error.message
    });
  }
};



///

exports.createFieldType = async (req, res) => {
  try {
    const createdBy = req.id;
    const { name, type,} = req.body;

    // Validate required fields
    if (!name || !type || !createdBy) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check if type is valid
    const validTypes = ["string", "integer", "float", "boolean", "image", "file", "date", "time", "select", "multi-select", "long-text"];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: "Invalid field type" });
    }

    // Create new FieldType entry
    const newFieldType = new FieldType({
      name,
      type,
      createdBy,
    });

    await newFieldType.save();
    res.status(201).json({ message: "FieldType created successfully", data: newFieldType });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getAllFieldTypeList = async (req, res) => {
  try {
    const fields = await FieldType.find({ isDeleted: false })
      .select('_id name type')  // Only select these fields
      .sort({ createdAt: -1 });
      
    res.status(200).json({
      success: true,
      message: "FieldType list fetched successfully",
      data: fields
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

//upload File

exports.uploadFile = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: "No files uploaded" });
    }

    // Assuming uploadToAzure handles a single file and returns a URL
    const uploadedFiles = await Promise.all(
      req.files.map(async (file) => {
        const fileUrl = await uploadToAzure(file);
        return fileUrl;
      })
    );

    res.status(200).json({
      success: true,
      message: "Files uploaded successfully",
      fileUrls: uploadedFiles,
    });
  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({
      success: false,
      message: "File upload failed",
      error: error.message,
    });
  }
};


// exports.uploadFile = async (req, res) => {
//   try {
//       if (!req.file) {
//           return res.status(400).json({ success: false, message: "No file uploaded" });
//       }

//       const isProduction = process.env.NODE_ENV === "production";
//       let fileUrl;

//       if (isProduction) {
//           const fileName = req.file.filename;
//           const filePath = req.file.path;

//           const blockBlobClient = containerClient.getBlockBlobClient(fileName);
//           const fileStream = fs.createReadStream(filePath);
//           await blockBlobClient.uploadStream(fileStream);

//           fileUrl = blockBlobClient.url;
//       } else {
//           fileUrl = `${req.protocol}://${req.get("host")}/uploads/images/${req.file.filename}`;
//       }

//       res.status(200).json({
//           success: true,
//           message: "File uploaded successfully",
//           fileUrl: fileUrl
//       });

//   } catch (error) {
//       console.error("Upload Error:", error);
//       res.status(500).json({
//           success: false,
//           message: "Failed to upload file",
//           error: error.message
//       });
//   }
// };
//customer section--
exports.addCustomerByAdmin = async (req, res) => {
  try {
      const { firstName, lastName, email, activeStatus } = req.body;

      if (!req.id) {
          return res.status(401).json({ success: false, message: "Unauthorized request." });
      }

      if (!firstName || !lastName) {
          return res.status(400).json({ success: false, message: "First name and last name are required." });
      }

      if (email) {
          const existingCustomer = await Customer.findOne({ email });
          if (existingCustomer) {
              return res.status(400).json({ success: false, message: "Email already exists." });
          }
      }

      const newCustomerData = {
          firstName,
          lastName,
          activeStatus: activeStatus ?? true,
          createdBy: req.id,
      };

      if (email) {
          newCustomerData.email = email;
      }

      const newCustomer = new Customer(newCustomerData);

      await newCustomer.save();


      let adminname = await Admin.findById(req.id).select("firstName lastName");
      let changeSummary = `Customer ${newCustomer.firstName} ${newCustomer.lastName} create by Admin ${adminname.firstName} ${adminname.lastName}`;
      await ActivityLog.create({
        customerId: newCustomer._id,
        performedBy: req.id,
        action: `customer create`,
        changeSummary: changeSummary
      });

      return res.status(201).json({ success: true, message: "Customer created successfully.", data: newCustomer });

  } catch (error) {
      console.error("Error adding customer:", error);
      return res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

exports.fetchCustomerFieldGroups = async (req, res) => {
  try {
    const groupFieldList = await FormField.aggregate([
      {
        $match: { isDeleted: false }
      },
      {
        $lookup: {
          from: "formgroups", // Ensure this matches your actual collection name
          localField: "form_group_id",
          foreignField: "_id",
          as: "formGroup"
        }
      },
      {
        $unwind: {
          path: "$formGroup",
          preserveNullAndEmptyArrays: true // Keep fields even if they have no group
        }
      },
      {
        $group: {
          _id: "$form_group_id",
          groupName: { $first: "$formGroup.name" }, // Get the group name
          fields: {
            $push: {
              attributeId: "$_id",
              attributeName: "$attributeName",
              attributeType: "$attributeType",
              attributeStatus: "$attributeState",
              attributeEnum: "$attributeEnum",
              attributeOption: "$attributeOption"
            }
          }
        }
      },
      {
        $sort: { "groupName": 1 } // Sort groups alphabetically
      }
    ]);

    res.status(200).json({
      message: "Form fields grouped by form groups retrieved successfully.",
      data: groupFieldList
    });
  } catch (error) {
    res.status(500).json({
      message: "An error occurred while retrieving form fields.",
      error: error.message
    });
  }
};

exports.fetchPreferencesFieldGroups = async (req, res) => {
  try {
    const groupFieldList = await PreferencesFields.aggregate([
      {
        $match: { isDeleted: false }
      },
      {
        $lookup: {
          from: "preferencesgroups",
          localField: "preferencesGroupId",
          foreignField: "_id",
          as: "preferencesGroup"
        }
      },
      {
        $unwind: {
          path: "$preferencesGroup",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $group: {
          _id: "$preferencesGroupId",
          groupName: { $first: "$preferencesGroup.name" },
          fields: {
            $push: {
              fieldId: "$_id",
              label: "$label",
              profileField: "$profileField",
              clientTypes: "$clientTypes",
              weight: "$weight",
              useInMatch: "$useInMatch",
              choices: "$choices",
              helpText: "$helpText",
              dealBreak: "$dealBreak",
              isActive: "$isActive"
            }
          }
        }
      },
      {
        $sort: { groupName: 1 }
      }
    ]);

    res.status(200).json({
      message: "Preferences fields grouped by preferences groups retrieved successfully.",
      data: groupFieldList
    });
  } catch (error) {
    res.status(500).json({
      message: "An error occurred while retrieving preferences fields.",
      error: error.message
    });
  }
};

exports.updateCustomerBasicDetail = async (req, res) => {
  try {
      // Validate request body
      const { error } = updateCustomerSchema.validate(req.body, { allowUnknown: false });
      if (error) {
        console.log(":::::::::")
          return res.status(400).json({ success: false, message: error.details[0].message });
      }

      const { customerId, ...updateData } = req.body;

      console.log("customerId:::::", customerId)

      if (!customerId) {
          return res.status(400).json({ success: false, message: "Customer ID is required" });
      }

      // Check if the email already exists (excluding the current customer)
      if (updateData.email) {
          const existingCustomer = await Customer.findOne({
              email: updateData.email,
              _id: { $ne: customerId }
          });

          if (existingCustomer) {
              return res.status(400).json({ success: false, message: "Email already exists" });
          }
      }

      // Find customer and update
      const customer = await Customer.findOneAndUpdate(
          { _id: customerId, isDeleted: false }, 
          { $set: updateData }, 
          { new: true, runValidators: true }
      );

      if (!customer) {
          return res.status(404).json({ success: false, message: "Customer not found" });
      }


      let adminname = await Admin.findById(req.id).select("firstName lastName");
      let changeSummary = `Customer ${customer.firstName} ${customer.lastName} updated "${Object.keys(updateData)}" by Admin ${adminname.firstName} ${adminname.lastName}`;
      await ActivityLog.create({
        customerId: customerId,
        performedBy: req.id,
        action: `${Object.keys(updateData)} Update`,
        changeSummary: changeSummary
      });

      res.status(200).json({ 
        success: true, 
        message: "Customer updated successfully",
        customer
       });

  } catch (error) {
      console.error("Error updating customer:", error.message);
      res.status(500).json({ success: false, message: "Failed to update customer", error: error.message });
  }
};

exports.updateCustomerProfile = async (req, res) => {
  try {
    const updatedBy = req.id;
    const { customerId, profileValue } = req.body;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: 'Customer ID is required'
      });
    }

    const customer = await Customer.findOne({ _id: customerId, isDeleted: false });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found or has been deleted'
      });
    }
    const fieldIdForLog = [];

    if (profileValue && Array.isArray(profileValue) && profileValue.length > 0) {
      await FormFieldsValue.deleteMany({ customerId });

      const insertData = [];

      for (const group of profileValue) {
        const { groupId, groupFields } = group;

        if (!groupId || !Array.isArray(groupFields)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid group structure in profileValue'
          });
        }

        for (const field of groupFields) {
          const { fieldID, fieldValue } = field;

          if (!fieldID || typeof fieldValue === 'undefined') {
            return res.status(400).json({
              success: false,
              message: 'Invalid field structure in groupFields'
            });
          }

          insertData.push({
            groupId: new mongoose.Types.ObjectId(groupId),
            fieldId: new mongoose.Types.ObjectId(fieldID),
            value: fieldValue,
            customerId: new mongoose.Types.ObjectId(customerId),
            updatedBy
          });
          fieldIdForLog.push({
            fieldId: new mongoose.Types.ObjectId(fieldID),
          });
        }
      }

      await FormFieldsValue.insertMany(insertData);
    }


    const fieldIds = fieldIdForLog.map(item => item.fieldId);

    const attributeNames = await FormField.find({
      _id: { $in: fieldIds }
    }).select("attributeName -_id"); // Only include attributeName, exclude _id
    
    const fieldIdValue = attributeNames.map(item => item.attributeName);

    console.log(fieldIdValue[0])
    let adminname = await Admin.findById(req.id).select("firstName lastName");
    let changeSummary = `Customer ${customer.firstName} ${customer.lastName} updated "${fieldIdValue[0]}" by Admin ${adminname.firstName} ${adminname.lastName}`;
    await ActivityLog.create({
      customerId: customerId,
      performedBy: req.id,
      action: `${Object.keys(fieldIdValue)} Update`,
      changeSummary: changeSummary
    });


    res.status(200).json({
      success: true,
      message: 'Customer Profile updated successfully',
      updatedCustomer: customer
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update customer',
      error: error.message
    });
  }
};


exports.updateCustomerMatchPreferences = async (req, res) => {
  try {
      const updatedBy = req.id;
      const { customerId, matchPreferences } = req.body;

      if (!customerId) {
          return res.status(400).json({
              success: false,
              message: 'Customer ID is required'
          });
      }

      const customer = await Customer.findOne({ _id: customerId, isDeleted: false });

      if (!customer) {
          return res.status(404).json({
              success: false,
              message: 'Customer not found or has been deleted'
          });
      }

      let fieldIdForLog = []

      if (matchPreferences && Array.isArray(matchPreferences) && matchPreferences.length > 0) {
          await PreferencesFieldsValue.deleteMany({ customerId });

          const insertData = [];
          for (const group of matchPreferences) {
              const { preferencesGroupId, groupFields } = group;
              if (!preferencesGroupId || !groupFields || !Array.isArray(groupFields)) {
                  return res.status(400).json({
                      success: false,
                      message: 'Invalid group structure in matchPreferences'
                  });
              }

              for (const field of groupFields) {
                  const { fieldId, fieldValue } = field;
                  insertData.push({
                      preferencesGroupId: new mongoose.Types.ObjectId(preferencesGroupId),
                      preferencesFieldId: new mongoose.Types.ObjectId(fieldId),
                      value: fieldValue,
                      customerId: new mongoose.Types.ObjectId(customerId),
                      updatedBy: new mongoose.Types.ObjectId(updatedBy)
                  });
                  fieldIdForLog.push({
                    preferencesFieldId: new mongoose.Types.ObjectId(fieldId),
                  });
              }
          }

          await PreferencesFieldsValue.insertMany(insertData);

      }


      const fieldIds = fieldIdForLog.map(item => item.preferencesFieldId);

      console.log("fieldIds::::::", fieldIds)

      const attributeNames = await PreferencesFields.find({
        _id: { $in: fieldIds }
      }).select("profileField -_id"); // Only include attributeName, exclude _id
      
      const fieldIdValue = attributeNames.map(item => item.profileField);
  
      console.log(fieldIdValue)
      let adminname = await Admin.findById(req.id).select("firstName lastName");
      let changeSummary = `Customer ${customer.firstName} ${customer.lastName} updated "${fieldIdValue[0]}" by Admin ${adminname.firstName} ${adminname.lastName}`;
      await ActivityLog.create({
        customerId: customerId,
        performedBy: req.id,
        action: `${Object.keys(fieldIdValue)} Update`,
        changeSummary: changeSummary
      });

      res.status(200).json({
          success: true,
          message: 'Customer profile updated successfully',
          updatedCustomer: customer
      });

  } catch (error) {
      res.status(500).json({
          success: false,
          message: 'Failed to update customer profile',
          error: error.message
      });
  }
};

exports.reactivateCustomer = async (req, res) => {
  try {
      const { customerId } = req.body;
      const updatedBy = req.id; // Get `updatedBy` from `req.id`

      // Check if customerId is provided
      if (!customerId) {
          return res.status(400).json({
              success: false,
              message: "Customer ID is required"
          });
      }

      // Find and reactivate the customer in a single step
      const customer = await Customer.findOneAndUpdate(
          { _id: customerId, isDeleted: false }, // Find only if `isDeleted: true`
          { 
              isDeleted: true,
              updatedBy: updatedBy // Update `updatedBy` from `req.id`
          },
          { new: true } // Return updated document
      );

      // If customer not found or already active
      if (!customer) {
          return res.status(404).json({
              success: false,
              message: "Customer not found or already active"
          });
      }

      res.status(200).json({
          success: true,
          message: "Customer reactivated successfully",
          customer
      });

  } catch (error) {
      console.error("Error reactivating customer:", error.message);
      res.status(500).json({
          success: false,
          message: "Internal Server Error",
          error: error.message
      });
  }
};

exports.getCustomerProfile = async (req, res) => {
  try {
      const { customerId } = req.body;

      // Validate customerId
      if (!customerId || !mongoose.Types.ObjectId.isValid(customerId)) {
          return res.status(400).json({
              success: false,
              message: "Invalid or missing Customer ID"
          });
      }

      const customerObjectId = new mongoose.Types.ObjectId(customerId);

      const customer = await Customer.aggregate([
          { $match: { _id: customerObjectId } },
          {
              $lookup: {
                  from: "formfieldsvalues",
                  localField: "_id",
                  foreignField: "customerId",
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
                  firstName: 1,
                  middleName: 1,
                  lastName: 1,
                  email: 1,
                  activeStatus: 1,
                  imagePath: 1,
                  address: 1,
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
                                          fieldName: {
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
                                          },
                                          value: "$$ff.value"
                                      }
                                  }
                              }
                          }
                      }
                  }
              }
          }
      ]);

      if (!customer || customer.length === 0) {
          return res.status(404).json({
              success: false,
              message: "Customer not found"
          });
      }

      res.status(200).json({
          success: true,
          message: "Customer profile retrieved successfully",
          data: customer[0]
      });

  } catch (error) {
      console.error("Error fetching customer profile:", error);
      res.status(500).json({
          success: false,
          message: "Internal Server Error",
          error: error.message
      });
  }
};

exports.getCustomerBasicDetail = async (req, res) => {
  try {
    const { customerId } = req.body;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: "Customer ID is required",
      });
    }

    const customer = await Customer.findOne({ _id: customerId, isDeleted: false })
      .select("firstName middelName lastName email Number contact address imagePath photos createdAt updatedAt")
      .lean();

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const clientLists = await ClientList.find({
      customers: customerId,
      isDeleted: false
    }).select("_id listName color").lean();

    res.status(200).json({
      success: true,
      message: "Customer details retrieved successfully",
      data: {
        ...customer,
        clientLists
      }
    });

  } catch (error) {
    console.error("Error fetching customer details:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch customer details",
      error: error.message,
    });
  }
};

exports.getCustomerProfileDetail = async (req, res) => {
  try {
      const { customerId } = req.body;

      if (!customerId || !mongoose.Types.ObjectId.isValid(customerId)) {
          return res.status(400).json({
              success: false,
              message: "Invalid or missing Customer ID"
          });
      }

      const customerObjectId = new mongoose.Types.ObjectId(customerId);

      const groups = await FormGroup.find({ isDeleted: false, isActive: true });

      const fields = await FormField.find({ isDeleted: false, isActive: true });

      const values = await FormFieldsValue.find({ customerId });

      console.log("values:::::::::", values)

      const dynamicFields = groups
          .map(group => {
              const groupFields = fields.filter(field => field.form_group_id.toString() === group._id.toString());

              if (groupFields.length === 0) return null;

              return {
                  groupId: group._id,
                  groupName: group.name,
                  fields: groupFields.map(field => {
                      const fieldValue = values.find(val => val.fieldId.toString() === field._id.toString());

                      console.log("fieldValue:::::::::::::", fieldValue)

                      return {
                          fieldId: field._id,
                          fieldName: field.attributeName,
                          attributeOption: field.attributeOption,
                          attributeType: field.attributeType,
                          value: fieldValue ? fieldValue.value : "NaN"
                      };
                  })
              };
          })
          .filter(group => group !== null);

      res.status(200).json({
          success: true,
          message: "Customer profile details retrieved successfully",
          data: dynamicFields
      });

  } catch (error) {
      console.error("Error fetching customer profile details:", error);
      res.status(500).json({
          success: false,
          message: "Internal Server Error",
          error: error.message
      });
  }
};

exports.getCustomerMatchPreferencesDetail = async (req, res) => {
  try {
      const { customerId } = req.body;

      if (!customerId || !mongoose.Types.ObjectId.isValid(customerId)) {
          return res.status(400).json({
              success: false,
              message: "Invalid or missing Customer ID"
          });
      }

      const customerObjectId = new mongoose.Types.ObjectId(customerId);

      const groups = await PreferencesGroup.find({ isDeleted: false, isActive: true });
      const fields = await PreferencesFields.find({ isDeleted: false, isActive: true });
      const values = await PreferencesFieldsValue.find({ customerId });

      const matchPreferences = groups
          .map(group => {
              const groupFields = fields.filter(field => field.preferencesGroupId.toString() === group._id.toString());

              if (groupFields.length === 0) return null;

              return {
                  groupId: group._id,
                  groupName: group.name,
                  fields: groupFields.map(field => {
                      const fieldValue = values.find(val => val.preferencesFieldId.toString() === field._id.toString());

                      return {
                          fieldId: field._id,
                          fieldName: field.label,
                          profileField: field.profileField,
                          clientTypes: field.clientTypes,
                          weight: field.weight,
                          useInMatch: field.useInMatch,
                          choices: field.choices,
                          helpText: field.helpText,
                          dealBreak: field.dealBreak,
                          value: fieldValue ? fieldValue.value : "NaN"
                      };
                  })
              };
          })
          .filter(group => group !== null);

      res.status(200).json({
          success: true,
          message: "Customer match preferences retrieved successfully",
          data: matchPreferences
      });

  } catch (error) {
      res.status(500).json({
          success: false,
          message: "Internal Server Error",
          error: error.message
      });
  }
};

exports.allActiveCustomer = async (req, res) => {
  try {
    const customers = await Customer.find(
      { activeStatus: true, isDeleted: false },
      { firstName: 1, middleName: 1, lastName: 1, email: 1, activeStatus: 1, imagePath: 1, address: 1, Number: 1 }
    );

    if (!customers.length) {
      return res.status(404).json({
        success: false,
        message: "No active customers found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Active customers retrieved successfully",
      data: customers
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching active customers",
      error: error.message
    });
  }
};


exports.createClientList = async (req, res) => {
  try {
    const { listName, color } = req.body;
    const createdBy = req.id;

    if (!listName || !color) {
      return res.status(400).json({ success: false, message: "List name and color are required" });
    }

    const newClientList = new ClientList({ listName, color, createdBy });
    await newClientList.save();

    res.status(201).json({ success: true, message: "Client List added!", data: newClientList });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error adding client list", error });
  }
};

exports.getAllClientLists = async (req, res) => {
  try {
    const clientLists = await ClientList.find({ isDeleted: false }).select("_id listName color status");

    res.status(200).json({
      success: true,
      message: "Client lists fetched successfully",
      data: clientLists
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching client lists",
      error: error.message
    });
  }
};

exports.editClientList = async (req, res) => {
  try {
    const { id, listName, color, status } = req.body;
    const updatedBy = req.id; // Get user ID from request

    if (!id) {
      return res.status(400).json({ success: false, message: "Client List ID is required" });
    }

    const updatedClientList = await ClientList.findByIdAndUpdate(
      id,
      { listName, color, status, updatedBy },
      { new: true, runValidators: true }
    );

    if (!updatedClientList) {
      return res.status(404).json({ success: false, message: "Client List not found" });
    }

    res.json({ success: true, message: "Client List updated!", data: updatedClientList });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating client list", error });
  }
};

exports.removeClientList = async (req, res) => {
  try {
    const { id } = req.body;
    const updatedBy = req.id; // Get user ID from request

    if (!id) {
      return res.status(400).json({ success: false, message: "Client List ID is required" });
    }

    const deletedClientList = await ClientList.findByIdAndUpdate(
      id,
      { isDeleted: true, updatedBy },
      { new: true }
    );

    if (!deletedClientList) {
      return res.status(404).json({ success: false, message: "Client List not found" });
    }

    res.json({ success: true, message: "Client List deleted!", data: deletedClientList });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting client list", error });
  }
};

exports.createPreferencesGroup = async (req, res) => {
  const { error } = preferencesGroupSchema.validate(req.body, { allowUnknown: false });
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    const adminId = req.id; // Extract admin/user ID from request

    // Check if a group with the same name already exists (excluding deleted ones)
    const existingGroup = await PreferencesGroup.findOne({ name: req.body.name, isDeleted: false });

    if (existingGroup) {
      return res.status(400).json({ message: "A preferences group with this name already exists" });
    }

    const newGroup = new PreferencesGroup({
      ...req.body,
      createdBy: adminId, // Track who created it
      // isDeleted: false,   // Ensure it's active
    });

    await newGroup.save();

    res.status(201).json({ 
      success: true,
      message: "Preferences group created successfully", 
      data: newGroup 
    });
  } catch (err) {
    res.status(500).json({ 
      message: "Error creating preferences group", 
      error: err.message 
    });
  }
};

exports.updatePreferencesGroup = async (req, res) => {
  try {
    const { groupId, name } = req.body;
    const adminId = req.id; // Extract admin ID from request

    if (!groupId || !name) {
      return res.status(400).json({ message: "Group ID and Name are required" });
    }

    // Check if the group exists
    const existingGroup = await PreferencesGroup.findById(groupId);
    if (!existingGroup) {
      return res.status(404).json({ message: "Preferences group not found" });
    }

    if (existingGroup.isDeleted) {
      return res.status(400).json({ message: "Cannot update a deleted preferences group" });
    }

    // Check for duplicate name in active groups
    const duplicateGroup = await PreferencesGroup.findOne({
      name: name.trim(),
      _id: { $ne: groupId }, // Exclude the current group
      isDeleted: false,
    });

    if (duplicateGroup) {
      return res.status(400).json({ message: "A preferences group with this name already exists" });
    }

    // Update the preferences group
    const updatedGroup = await PreferencesGroup.findByIdAndUpdate(
      groupId,
      { name: name.trim(), editedBy: adminId },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Preferences group updated successfully",
      data: updatedGroup,
    });

  } catch (err) {
    return res.status(500).json({
      message: "Error updating preferences group",
      error: err.message,
    });
  }
};

exports.deletePreferencesGroup = async (req, res) => {
  try {
    const { groupId } = req.body;
    const adminId = req.id;

    if (!groupId) {
      return res.status(400).json({ message: "Group ID is required" });
    }

    const existingGroup = await PreferencesGroup.findById(groupId);

    if (!existingGroup) {
      return res.status(404).json({ message: "Preferences group not found" });
    }

    if (existingGroup.isDeleted) {
      return res.status(400).json({ message: "Preferences group is already deleted" });
    }

    existingGroup.isDeleted = true;
    existingGroup.editedBy = adminId;
    await existingGroup.save();

    return res.status(200).json({
      success: true, 
      message: "Preferences group deleted successfully", 
      data: existingGroup 
    });

  } catch (err) {
    return res.status(500).json({ 
      message: "Error deleting preferences group", 
      error: err.message 
    });
  }
};

exports.getPreferencesGroupList = async (req, res) => {
  try {
    const groups = await PreferencesGroup.find({ isDeleted: false }).select("_id name");

    res.status(200).json({ 
      success: true,
      message: "Preferences groups fetched successfully", 
      data: groups 
    });

  } catch (err) {
    res.status(500).json({ 
      message: "Error fetching preferences groups", 
      error: err.message 
    });
  }
};

exports.createPreferencesField = async (req, res) => {
  try {
    const { error } = preferencesFieldSchema.validate(req.body, { allowUnknown: false });

    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { label, profileField, clientTypes, weight, useInMatch, choices, helpText, dealBreak, preferencesGroupId } = req.body;
    const adminId = req.id;

    const existingGroup = await PreferencesGroup.findById(preferencesGroupId);
    if (!existingGroup || existingGroup.isDeleted) {
      return res.status(400).json({ message: "Preferences group does not exist or has been deleted" });
    }

    const existingField = await PreferencesFields.findOne({ label, preferencesGroupId, isDeleted: false });
    if (existingField) {
      return res.status(400).json({ message: "A field with this label already exists in the group" });
    }

    const newField = new PreferencesFields({
      label,
      profileField,
      clientTypes,
      weight,
      useInMatch,
      choices,
      helpText,
      dealBreak,
      preferencesGroupId,
      createdBy: adminId,
    });

    await newField.save();

    res.status(201).json({
      success: true,
      message: "Preferences field created successfully",
      data: newField,
    });

  } catch (err) {
    res.status(500).json({
      message: "Error creating preferences field",
      error: err.message,
    });
  }
};

exports.updatePreferencesField = async (req, res) => {
  try {
    const { error } = updatePreferencesFieldSchema.validate(req.body, { allowUnknown: false });
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { fieldId, preferencesGroupId, label } = req.body;
    const adminId = req.id;

    const existingField = await PreferencesFields.findById(fieldId);
    if (!existingField) {
      return res.status(404).json({ message: "Preferences field not found" });
    }

    if (existingField.isDeleted) {
      return res.status(400).json({ message: "Cannot update a deleted preferences field" });
    }

    if (preferencesGroupId) {
      const existingGroup = await PreferencesGroup.findById(preferencesGroupId);
      if (!existingGroup || existingGroup.isDeleted) {
        return res.status(400).json({ message: "Preferences group does not exist or has been deleted" });
      }
    }

    if (label) {
      const duplicateField = await PreferencesFields.findOne({
        label: label,
        preferencesGroupId: preferencesGroupId || existingField.preferencesGroupId,
        _id: { $ne: fieldId },
        isDeleted: false,
      });

      if (duplicateField) {
        return res.status(400).json({ message: "A preferences field with this label already exists in the group" });
      }
    }

    const updatedField = await PreferencesFields.findByIdAndUpdate(
      fieldId,
      { ...req.body, editedBy: adminId },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Preferences field updated successfully",
      data: updatedField,
    });

  } catch (err) {
    res.status(500).json({
      message: "Error updating preferences field",
      error: err.message,
    });
  }
};

exports.changePreferencesFieldGroup = async (req, res) => {
  try {
    const { fieldId, newGroupId } = req.body;
    const adminId = req.id;

    if (!fieldId || !newGroupId) {
      return res.status(400).json({ message: "Field ID and New Group ID are required" });
    }

    const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);
    if (!isValidObjectId(fieldId) || !isValidObjectId(newGroupId)) {
      return res.status(400).json({ message: "Invalid Field ID or Group ID format" });
    }

    const existingField = await PreferencesFields.findById(fieldId);
    if (!existingField) {
      return res.status(404).json({ message: "Preferences field not found" });
    }

    if (existingField.isDeleted) {
      return res.status(400).json({ message: "Cannot change group for a deleted preferences field" });
    }

    const targetGroup = await PreferencesGroup.findById(newGroupId);
    if (!targetGroup) {
      return res.status(404).json({ message: "Target preferences group not found" });
    }

    if (targetGroup.isDeleted) {
      return res.status(400).json({ message: "Cannot move to a deleted preferences group" });
    }

    existingField.preferencesGroupId = newGroupId;
    existingField.editedBy = adminId;
    await existingField.save();

    res.status(200).json({success: true, message: "Preferences field group changed successfully", data: existingField });

  } catch (err) {
    res.status(500).json({ message: "Error changing preferences field group", error: err.message });
  }
};

exports.deletePreferencesField = async (req, res) => {
  try {
    const { fieldId } = req.body;
    const adminId = req.id;

    if (!fieldId) {
      return res.status(400).json({ message: "Field ID is required" });
    }

    const existingField = await PreferencesFields.findById(fieldId);
    if (!existingField) {
      return res.status(404).json({ message: "Preferences field not found" });
    }

    if (existingField.isDeleted) {
      return res.status(400).json({ message: "Preferences field is already deleted" });
    }

    await PreferencesFields.findByIdAndUpdate(fieldId, { isDeleted: true, editedBy: adminId }, { new: true });

    res.status(200).json({ message: "Preferences field deleted successfully" });
  } catch (err) {
    res.status(500).json({success: true, message: "Error deleting preferences field", error: err.message });
  }
};

exports.getAllPreferencesGroupFields = async (req, res) => {
  try {
    const groupFieldList = await PreferencesGroup.aggregate([
      {
        $match: { isDeleted: false }
      },
      {
        $lookup: {
          from: "preferencesfields",
          localField: "_id",
          foreignField: "preferencesGroupId",
          as: "fields"
        }
      },
      {
        $unwind: {
          path: "$fields",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $match: { "fields.isDeleted": false }
      },
      {
        $group: {
          _id: "$_id",
          groupName: { $first: "$name" },
          fields: {
            $push: {
              fieldId: "$fields._id",
              fieldName: "$fields.label",
              profileField: "$fields.profileField",
              clientTypes: "$fields.clientTypes",
              weight: "$fields.weight",
              useInMatch: "$fields.useInMatch",
              choices: "$fields.choices",
              helpText: "$fields.helpText",
              dealBreak: "$fields.dealBreak",
              isActive: "$fields.isActive"
            }
          }
        }
      },
      {
        $sort: { groupName: 1 }
      }
    ]);

    res.status(200).json({
      success: true,
      message: "Preferences groups with their fields retrieved successfully.",
      data: groupFieldList
    });
  } catch (error) {
    res.status(500).json({
      message: "An error occurred while retrieving preferences groups and fields.",
      error: error.message
    });
  }
};

exports.addCustomerPhoto = async (req, res) => {
  try {
    const { customerId, url } = req.body;

    if (!customerId || !url || !Array.isArray(url)) {
      return res.status(400).json({
        success: false,
        message: 'customerId and an array of urls are required',
      });
    }

    const photoObjects = url.map((u) => ({ url: u }));

    const updatedCustomer = await Customer.findOneAndUpdate(
      { _id: customerId, isDeleted: false },
      { $addToSet: { photos: { $each: photoObjects } } },
      { new: true }
    );

    if (!updatedCustomer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Photos added (if not already present)',
      photos: updatedCustomer.photos,
    });

  } catch (error) {
    console.error('Error adding photo:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};



/////
exports.submissionForm = async (req, res) => {
  try {
    const createdBy = req.id;
    const { formName, ProfileDetails, matchDetails } = req.body;

    if (!formName || !ProfileDetails || !matchDetails || !createdBy) {
      return res.status(400).json({ error: "All required fields must be provided." });
    }

    // Validate ProfileDetails
    for (let detail of ProfileDetails) {
      if (!detail.group || !detail.fields || !Array.isArray(detail.fields)) {
        return res.status(400).json({ error: "Each ProfileDetail must include group and fields array." });
      }
      const groupExists = await FormGroup.findById(detail.group);
      if (!groupExists) {
        return res.status(404).json({ error: `No FormGroup found with groupId: ${detail.group}.` });
      }
      for (let fieldId of detail.fields) {
        const fieldExists = await FormField.findById(fieldId);
        if (!fieldExists) {
          return res.status(404).json({ error: `No FormField found with fieldId: ${fieldId}.` });
        }
      }
    }

    // Validate matchDetails
    for (let detail of matchDetails) {
      if (!detail.group || !detail.fields || !Array.isArray(detail.fields)) {
        return res.status(400).json({ error: "Each matchDetail must include group and fields array." });
      }
      const groupExists = await PreferencesGroup.findById(detail.group);
      if (!groupExists) {
        return res.status(404).json({ error: `No PreferencesGroup found with groupId: ${detail.group}.` });
      }
      for (let fieldId of detail.fields) {
        const fieldExists = await PreferencesFields.findById(fieldId);
        if (!fieldExists) {
          return res.status(404).json({ error: `No PreferencesFields found with fieldId: ${fieldId}.` });
        }
      }
    }

    const newSubmission = new SubmissionForm({
      formName,
      ProfileDetails,
      matchDetails,
      createdBy,
    });

    // Save to database
    await newSubmission.save();

    res.status(201).json({
      success: true,
      message: "Submission form created successfully!",
      data: newSubmission
    });
  } catch (error) {
    console.error("Error creating submission form:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

exports.getSubmissionFormById = async (req, res) => {
  try {
    const { submissionFormId } = req.body;

    if (!submissionFormId) {
      return res.status(400).json({ error: "SubmissionForm ID is required." });
    }

    const submissionForm = await SubmissionForm.findById(submissionFormId)
      .populate({
        path: "ProfileDetails.group",
        model: FormGroup,
        select: "-__v -isDeleted -createdAt -updatedAt -createdBy -editedBy -isActive"
      })
      .populate({
        path: "ProfileDetails.fields",
        model: FormField,
        select: "-__v -isDeleted -createdAt -updatedAt"
      })
      .populate({
        path: "matchDetails.group",
        model: PreferencesGroup,
        select: "-__v -isDeleted -createdAt -updatedAt -createdBy -editedBy -isActive"
      })
      .populate({
        path: "matchDetails.fields",
        model: PreferencesFields,
        select: "-__v -isDeleted -createdAt -updatedAt"
      });

    if (!submissionForm) {
      return res.status(404).json({ error: "Submission Form not found." });
    }

    const allowedCities = [
      "Amritsar", "Barnala", "Bathinda", "Dera Bassi", "Delhi", "Chandigarh", "Faridkot",
      "Fatehgarh Sahib", "Firozpur", "Gurdaspur", "Gujarat", "Hoshiarpur", "Himachal Pradesh",
      "Haryana", "Jalandhar", "Jammu and Kashmir", "Kapurthala", "Khanna", "Ludhiana", "Mansa",
      "Moga", "Muktsar(Sri Muktsar Sahib)", "Nakodar", "Patiala", "Phagwara", "Rupnagar",
      "Rajasthan", "(Mohali)Sahibzada Ajit Singh Nagar", "Sangrur",
      "(Nawanshahr)Shahid Bhagat Singh Nagar", "Tarn Taran", "Uttarakhand", "Uttar Pradesh", "Zirakpur"
    ];

    const address = submissionForm.BasicDetail?.address || {};

    const BasicDetail = {
      firstName: submissionForm.BasicDetail?.firstName || null,
      middleName: submissionForm.BasicDetail?.middelName || null, // Schema typo respected
      lastName: submissionForm.BasicDetail?.lastName || null,
      Number: submissionForm.BasicDetail?.Number || null,
      email: submissionForm.BasicDetail?.email || null,
      address: {
        city: address.city || null,
        state: address.state || null,
        country: address.country || null,
        postalCode: address.postalCode || null,
        cityOptions: allowedCities
      }
    };

    res.status(200).json({
      BasicDetail,
      ProfileDetails: submissionForm.ProfileDetails || [],
      matchDetails: submissionForm.matchDetails || []
    });
  } catch (error) {
    console.error("Error fetching submission form:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


exports.updateSubmissionForm = async (req, res) => {
  try {
    const updatedBy = req.id;
    const { submissionFormId, formName, clientDetails, matchDetails } = req.body;

    if (!submissionFormId) {
      return res.status(400).json({ error: "SubmissionForm ID is required." });
    }

    let submissionForm = await SubmissionForm.findById(submissionFormId);
    if (!submissionForm) {
      return res.status(404).json({ error: "Submission Form not found." });
    }

    // Validate clientDetails
    if (clientDetails) {
      for (let detail of clientDetails) {
        const groupExists = await FormGroup.findById(detail.group);
        if (!groupExists) {
          return res.status(404).json({ error: `No FormGroup found for ID ${detail.group}` });
        }
        for (let field of detail.fields) {
          const fieldExists = await FormField.findById(field);
          if (!fieldExists) {
            return res.status(404).json({ error: `No FormField found for ID ${field}` });
          }
        }
      }
    }

    // Validate matchDetails
    if (matchDetails) {
      for (let detail of matchDetails) {
        const groupExists = await PreferencesGroup.findById(detail.group);
        if (!groupExists) {
          return res.status(404).json({ error: `No PreferencesGroup found for ID ${detail.group}` });
        }
        for (let field of detail.fields) {
          const fieldExists = await PreferencesFields.findById(field);
          if (!fieldExists) {
            return res.status(404).json({ error: `No PreferencesFields found for ID ${field}` });
          }
        }
      }
    }

    // Update submission form
    submissionForm.formName = formName || submissionForm.formName;
    submissionForm.clientDetails = clientDetails || submissionForm.clientDetails;
    submissionForm.matchDetails = matchDetails || submissionForm.matchDetails;
    submissionForm.updatedBy = updatedBy || submissionForm.updatedBy;

    await submissionForm.save();

    res.status(200).json({ message: "Submission Form updated successfully!", data: submissionForm });
  } catch (error) {
    console.error("Error updating submission form:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};


//add match group apis
exports.createMatchGroup = async (req, res) => {
  try {
    const { groupName } = req.body;
    const createdBy = req.id;

    if (!groupName) {
      return res.status(400).json({
        success: false,
        message: "Group name is required.",
      });
    }

    const existing = await MatchGroup.findOne({ groupName, isDeleted: false });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Group name already exists.",
      });
    }

    const newGroup = new MatchGroup({ groupName, createdBy });
    const saved = await newGroup.save();

    res.status(201).json({
      success: true,
      message: "Group created successfully.",
      data: saved,
    });
  } catch (err) {
    console.error("Error creating group:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

exports.updateMatchGroupName = async (req, res) => {
  try {
    const { id, groupName } = req.body;

    if (!id || !groupName) {
      return res.status(400).json({
        success: false,
        message: "Both id and group name are required.",
      });
    }

    const group = await MatchGroup.findOne({ _id: id, isDeleted: false });
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found or already deleted.",
      });
    }

    const duplicate = await MatchGroup.findOne({
      _id: { $ne: id },
      groupName,
      isDeleted: false,
    });

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: "Another group with the same name exists.",
      });
    }

    group.groupName = groupName;
    await group.save();

    res.status(200).json({
      success: true,
      message: "Group name updated successfully.",
      data: group,
    });
  } catch (err) {
    console.error("Error updating group name:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

exports.deleteMatchGroup = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Group ID is required.",
      });
    }

    const group = await MatchGroup.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Group deleted successfully.",
      data: group,
    });
  } catch (err) {
    console.error("Error deleting group:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

exports.getAllMatchGroups = async (req, res) => {
  try {
    const groups = await MatchGroup.find({ isDeleted: false }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      message: "Groups fetched successfully.",
      data: groups,
    });
  } catch (err) {
    console.error("Error fetching groups:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

exports.createMatchGroupValue = async (req, res) => {
  try {
    const { matchGroupId, customerId, matchCustomerId, matchingDescription } = req.body;
    const createdBy = req.id;

    if (!matchGroupId || !customerId || !matchCustomerId?.length) {
      return res.status(400).json({
        success: false,
        message: "matchGroupId, customerId and matchCustomerId[] are required.",
      });
    }

    const value = new MatchGroupValue({
      matchGroupId,
      customerId,
      matchCustomerId,
      matchingDescription,
      createdBy,
    });

    const saved = await value.save();

    res.status(201).json({
      success: true,
      message: "Match group value created successfully.",
      data: saved,
    });
  } catch (err) {
    console.error("Error creating match group value:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

exports.getMatchGroupDetails = async (req, res) => {
  try {
    const { customerId } = req.body;

    if (!customerId || !mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing Customer ID"
      });
    }

    const customerObjectId = new mongoose.Types.ObjectId(customerId);

    // Get all groups
    const allGroups = await MatchGroup.find({ isDeleted: false });

    // Check if any values exist for this customer
    const customerValuesExist = await MatchGroupValue.exists({
      customerId: customerObjectId,
      isDeleted: false
    });

    let allValues = [];

    // Get all values if customer has any
    if (customerValuesExist) {
      allValues = await MatchGroupValue.find({
        customerId: customerObjectId,
        isDeleted: false
      }).populate("matchCustomerId");
    }

    // Combine groups + their values
    const results = allGroups.map(group => {
      const groupValues = allValues.filter(val => val.matchGroupId.toString() === group._id.toString());

      return {
        groupId: group._id,
        groupName: group.groupName,
        count: groupValues.length,
        values: groupValues.map(val => {
          const customer = val.matchCustomerId || {};

          return {
            valueId: val._id,
            matchCustomerId: customer._id || null,
            firstName: customer.firstName || "N/A",
            middleName: customer.middelName || "",
            lastName: customer.lastName || "N/A",
            number: customer.Number || null,
            email: customer.email || "N/A",
            imagePath: customer.imagePath || null,
            address: customer.address || {},
            matchingDescription: val.matchingDescription || ""
          };
        })
      };
    });

    res.status(200).json({
      success: true,
      message: "Match group details retrieved successfully.",
      data: results
    });
  } catch (error) {
    console.error("Error in getMatchGroupDetails:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
};

exports.updateMatchGroupValue = async (req, res) => {
  try {
    const { id, matchGroupId, customerId, matchCustomerId, matchingDescription } = req.body;
    const editedBy = req.id;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "MatchGroupValue ID is required in the body.",
      });
    }

    const existing = await MatchGroupValue.findById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "MatchGroupValue not found.",
      });
    }

    if (matchGroupId !== undefined) existing.matchGroupId = matchGroupId;
    if (customerId !== undefined) existing.customerId = customerId;
    if (matchCustomerId !== undefined) existing.matchCustomerId = matchCustomerId;
    if (matchingDescription !== undefined) existing.matchingDescription = matchingDescription;
    existing.editedBy = editedBy;

    const updated = await existing.save();

    res.status(200).json({
      success: true,
      message: "Match group value updated successfully.",
      data: updated,
    });
  } catch (err) {
    console.error("Error updating match group value:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

exports.deleteMatchGroupValue = async (req, res) => {
  try {
    const { id } = req.body;
    const editedBy = req.id;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "MatchGroupValue ID is required in the body.",
      });
    }

    const matchGroupValue = await MatchGroupValue.findById(id);
    if (!matchGroupValue || matchGroupValue.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "MatchGroupValue not found or already deleted.",
      });
    }

    matchGroupValue.isDeleted = true;
    matchGroupValue.editedBy = editedBy;

    const deleted = await matchGroupValue.save();

    res.status(200).json({
      success: true,
      message: "Match group value deleted (soft) successfully.",
      data: deleted,
    });
  } catch (err) {
    console.error("Error deleting match group value:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

exports.searchCustomerByName = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid name to search"
      });
    }

    const searchWords = name.trim().split(/\s+/); // Split by spaces, handles "manish   prasad"

    // Create conditions for each word to match any part of the name
    const nameConditions = searchWords.map(word => {
      const regex = new RegExp(word, 'i');
      return {
        $or: [
          { firstName: regex },
          { middelName: regex },
          { lastName: regex }
        ]
      };
    });

    // Combine all word conditions with AND
    const customers = await Customer.find({
      isDeleted: false,
      $and: nameConditions
    }).select('firstName middelName lastName email Number imagePath');

    res.status(200).json({
      success: true,
      message: "Customers fetched successfully",
      data: customers
    });

  } catch (error) {
    console.error("Error in searchCustomerByName:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

exports.addCustomerToClientList = async (req, res) => {
  try {
    const { clientListId, customerId } = req.body;
    const adminId = req.id; // Assumes user auth middleware sets this

    if (!clientListId || !customerId) {
      return res.status(400).json({ message: "clientListId and customerId are required." });
    }

    const clientList = await ClientList.findById(clientListId);

    if (!clientList || clientList.isDeleted) {
      return res.status(404).json({ message: "Client list not found or has been deleted." });
    }

    const alreadyExists = clientList.customers.includes(customerId);

    if (alreadyExists) {
      return res.status(409).json({ message: "Customer is already in the list." });
    }

    clientList.customers.push(customerId);
    clientList.updatedBy = adminId;

    await clientList.save();

    res.status(200).json({
      message: "Customer added to the client list successfully.",
      data: clientList
    });

  } catch (error) {
    console.error("Error adding customer to client list:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

exports.removeCustomerFromClientList = async (req, res) => {
  try {
    const { clientListId, customerId } = req.body;
    const adminId = req.id; // Assumes authentication middleware sets this

    if (!clientListId || !customerId) {
      return res.status(400).json({ success: false, message: "clientListId and customerId are required." });
    }

    const clientList = await ClientList.findById(clientListId);

    if (!clientList || clientList.isDeleted) {
      return res.status(404).json({ success: false, message: "Client list not found or has been deleted." });
    }

    const index = clientList.customers.indexOf(customerId);
    if (index === -1) {
      return res.status(404).json({ success: false, message: "Customer not found in this client list." });
    }

    clientList.customers.splice(index, 1);
    clientList.updatedBy = adminId;

    await clientList.save();

    res.status(200).json({
      success: true,
      message: "Customer removed from the client list successfully.",
      data: clientList
    });

  } catch (error) {
    console.error("Error removing customer from client list:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

exports.getMatchingSuggestions = async (req, res) => {
  try {
    const { customerId } = req.body;

    if (!customerId || !mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({ success: false, message: "Invalid or missing Customer ID" });
    }

    // STEP 1: Get current user's preferences
    const preferencesValues = await PreferencesFieldsValue.find({ customerId });
    const preferencesFields = await PreferencesFields.find({ isActive: true, isDeleted: false });

    const preferenceMap = {};
    preferencesValues.forEach(pref => {
      preferenceMap[pref.preferencesFieldId.toString()] = pref.value;
    });

    // STEP 2: Get other customers
    const otherCustomers = await Customer.find({ _id: { $ne: customerId }, isDeleted: false, activeStatus: true });

    const matches = [];

    for (const customer of otherCustomers) {
      const profileFields = await FormFieldsValue.find({ customerId: customer._id });
      const profileFieldMap = {};
      profileFields.forEach(f => {
        profileFieldMap[f.fieldId.toString()] = f.value;
      });

      const matchDetails = [];
      let totalWeight = 0;
      let matchScore = 0;
      let dealBreaker = false;

      for (const prefField of preferencesFields) {
        const prefValue = preferenceMap[prefField._id.toString()];
        if (!prefValue) continue;

        // Find matching profile value
        const profileVal = profileFieldMap[prefField.profileField];

        const isMatch = Array.isArray(prefValue)
          ? prefValue.includes(profileVal)
          : prefValue === profileVal;

        if (isMatch) {
          if (prefField.weight === "High") matchScore += 3;
          else if (prefField.weight === "Medium") matchScore += 2;
          else matchScore += 1;
        } else if (prefField.dealBreak) {
          dealBreaker = true;
          break;
        }

        // Calculate total weight regardless of match
        if (prefField.weight === "High") totalWeight += 3;
        else if (prefField.weight === "Medium") totalWeight += 2;
        else totalWeight += 1;

        matchDetails.push({
          label: prefField.label,
          preference: prefValue,
          actual: profileVal,
          weight: prefField.weight,
          matched: isMatch
        });
      }

      if (!dealBreaker && totalWeight > 0) {
        matches.push({
          customer,
          matchPercentage: Math.round((matchScore / totalWeight) * 100),
          matchDetails
        });
      }
    }

    matches.sort((a, b) => b.matchPercentage - a.matchPercentage);

    res.status(200).json({
      success: true,
      message: "Matching suggestions retrieved successfully.",
      data: matches
    });

  } catch (error) {
    console.error("Error in matching suggestion:", error);
    res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};

exports.createEmailTemplate = async (req, res) => {
  try {
    const { name, subject, body } = req.body;

    // Validation (only subject and body are required now)
    if (!subject || !body) {
      return res.status(400).json({ message: 'Subject and body are required.' });
    }

    const template = new EmailTemplate({
      name: name ? name.trim() : undefined, // Optional trimming if provided
      subject: subject.trim(),
      body,
      createdBy: req.id || null // Optional, based on your auth setup
    });

    await template.save();

    return res.status(201).json({
      success: true,
      message: 'Template created successfully.',
      data: template
    });
  } catch (error) {
    console.error('Create Email Template Error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

exports.getAllEmailTemplates = async (req, res) => {
  try {
      const templates = await EmailTemplate.find({ isDeleted: false }).sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        message: 'Templates fetched successfully.',
        data: templates
      });
  } catch (error) {
      console.error('Get All Email Templates Error:', error);
      return res.status(500).json({ message: 'Internal server error.' });
  }
};

exports.deleteEmailTemplate = async (req, res) => {
  try {
      const { id } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
          return res.status(400).json({ message: 'Invalid template ID.' });
      }

      const deleted = await EmailTemplate.findByIdAndUpdate(id, { isDeleted: true }, { new: true });

      if (!deleted) {
          return res.status(404).json({ message: 'Template not found.' });
      }

      return res.status(200).json({
        success: true,
        message: 'Template deleted successfully.',
        data: deleted
      });
  } catch (error) {
      console.error('Delete Email Template Error:', error);
      return res.status(500).json({ message: 'Internal server error.' });
  }
};

exports.updateEmailTemplate = async (req, res) => {
  try {
    const { id, name, subject, body } = req.body;

    // Validate ID
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Valid template ID is required.' });
    }

    // Build update object with only provided fields
    const updateFields = {};
    if (name) updateFields.name = name.trim();
    if (subject) updateFields.subject = subject.trim();
    if (body) updateFields.body = body;

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ message: 'At least one field (name, subject, or body) must be provided to update.' });
    }

    const updatedTemplate = await EmailTemplate.findOneAndUpdate(
      { _id: id, isDeleted: false },
      updateFields,
      { new: true }
    );

    if (!updatedTemplate) {
      return res.status(404).json({ message: 'Template not found or already deleted.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Template updated successfully.',
      data: updatedTemplate
    });
  } catch (error) {
    console.error('Update Email Template Error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

exports.getEmailTemplateById = async (req, res) => {
  try {
    const { id } = req.body;

    // Check if ID is provided and valid
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Valid template ID is required.'
      });
    }

    // Find the template
    const template = await EmailTemplate.findOne({ _id: id, isDeleted: false });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found.'
      });
    }

    // Respond with success
    return res.status(200).json({
      success: true,
      message: 'Email template fetched successfully.',
      data: template
    });
  } catch (error) {
    console.error('Get Email Template by ID Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error.',
      error: error.message
    });
  }
};

exports.sendCustomerMail = async (req, res) => {
    try {
        const { customerId, subject, body, attachments = [], meetingDetails = null } = req.body;
        const adminId = req.id;

        if (!customerId || !subject || !body) {
            return res.status(400).json({ message: 'customerId, subject, and body are required.' });
        }

        // Fetch the customer
        const customer = await Customer.findById(customerId);
        if (!customer || !customer.email) {
            return res.status(404).json({ message: 'Customer not found or missing email.' });
        }

        const emailResponse = await sendEmail({
            to: customer.email,
            subject,
            text: body.replace(/<[^>]*>/g, ''), // Strip HTML for plain text
            html: body,
            attachments,
        });

        const mailLog = new MailLog({
          customer: customer._id,
          subject,
          body,
          sentBy: adminId,
          sentByEmail: process.env.SENDGRID_FROM_EMAIL, 
          deliveryStatus: emailResponse.success ? 'Sent' : 'Failed',
          meetingDetails,
          attachments: attachments.map(att => ({
            fileName: att.filename || '',
            fileUrl: att.content ? 'Base64' : att.url || '',
          }))
        });

        await mailLog.save();


        let adminname = await Admin.findById(req.id).select("firstName lastName");
        let changeSummary = `Sanded mail to ${customer.firstName} ${customer.lastName} "subject : ${subject}" by Admin ${adminname.firstName} ${adminname.lastName}`;
        await ActivityLog.create({
          customerId: customer._id,
          performedBy: req.id,
          action: `mail sent`,
          changeSummary: changeSummary
        });
        return res.status(200).json({
            // success: true,
            // message: emailResponse.success ? 'Email sent and logged successfully.' : 'Failed to send email but log created.',
            // mailLog,
            // sendStatus: emailResponse.success
            success: true,
            message: 'Email Sent successfully.',
            // data: template
        });
    } catch (error) {
        console.error('Send Customer Mail Error:', error);
        return res.status(500).json({ message: 'Internal server error.', error });
    }
};

exports.sendMailForIntro = async (req, res) => {
  try {
    const { customerId, introLink, subject, body, extraEmails = [] } = req.body;
    const adminId = req.id;

    if (!customerId || !subject || !body || !introLink) {
      return res.status(400).json({ message: 'customerId, subject, body, and introLink are required.' });
    }

    // Fetch customer
    const customer = await Customer.findById(customerId);
    if (!customer || !customer.email) {
      return res.status(404).json({ message: 'Customer not found or email missing.' });
    }

    // Collect all recipients
    const recipients = [customer.email, ...extraEmails];

    // Send email to each recipient
    const sendResults = await Promise.all(
      recipients.map(email =>
        sendEmail({
          to: email,
          subject,
          text: body.replace(/<[^>]*>/g, '') + '\n\n' + introLink, // Plain text version
          html: `${body}<br/><br/><a href="${introLink}">${introLink}</a>`
        })
      )
    );

    // Log email once (mainly for customer)
    const mailLog = new MailLog({
      customer: customer._id,
      subject,
      body,
      sentBy: adminId,
      sentByEmail: process.env.SENDGRID_FROM_EMAIL,
      deliveryStatus: sendResults[0]?.success ? 'Sent' : 'Failed'
    });

    await mailLog.save();


    let adminname = await Admin.findById(req.id).select("firstName lastName");
    let changeSummary = `Sanded mail to ${customer.firstName} ${customer.lastName} "subject : ${subject}" by Admin ${adminname.firstName} ${adminname.lastName}`;
    await ActivityLog.create({
      customerId: customer._id,
      performedBy: req.id,
      action: `mail sent`,
      changeSummary: changeSummary
    });

    return res.status(200).json({
      success: true,
      message: 'Intro email(s) sent successfully.',
      recipients
    });

  } catch (error) {
    console.error('Send Intro Mail Error:', error);
    return res.status(500).json({ message: 'Internal server error.', error });
  }
};

exports.getMailLogs = async (req, res) => {
  try {
    const { search } = req.body;
    let logs = [];

    if (search && search.trim().length > 0) {
      const regex = new RegExp(search.trim(), 'i');

      // Find matching customers
      const matchedCustomers = await Customer.find({
        $or: [
          { firstName: regex },
          { lastName: regex },
          { email: regex }
        ]
      }).select('_id');

      const customerIds = matchedCustomers.map(c => c._id);

      // Find logs where:
      // - customer is in matched customers OR
      // - subject matches the search
      logs = await MailLog.find({
        $or: [
          { customer: { $in: customerIds } },
          { subject: regex }
        ]
      })
        .populate('customer', 'email firstName lastName')
        .sort({ sentAt: -1 });
    } else {
      // No search: get all logs
      logs = await MailLog.find()
        .populate('customer', 'email firstName lastName')
        .sort({ sentAt: -1 });
    }

    const result = logs.map(log => ({
      to: log.customer?.email || 'N/A',
      customerName: `${log.customer?.firstName || ''} ${log.customer?.lastName || ''}`.trim(),
      from: log.sentByEmail,
      subject: log.subject,
      body: log.body,
      time: log.sentAt,
      status: log.deliveryStatus
    }));

    return res.status(200).json({ count: result.length, logs: result });
  } catch (error) {
    console.error('Get/Search Mail Logs Error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

exports.getTodayStatsCount = async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Count customers added today
    const customerCount = await Customer.countDocuments({
      createdAt: { $gte: startOfDay, $lte: endOfDay },
      isDeleted: false
    });

    // Count mails sent today
    const mailCount = await MailLog.countDocuments({
      sentAt: { $gte: startOfDay, $lte: endOfDay }
    });

    return res.status(200).json({
      success: true,
      message: 'Today\'s counts fetched successfully.',
      data: {
        customersAddedToday: customerCount,
        mailsSentToday: mailCount,
        EventsToday: 0
      }
    });
  } catch (error) {
    console.error('Error fetching today\'s counts:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};


exports.getCustomerCountLastFiveDays = async (req, res) => {
  try {
    const today = moment().startOf('day');
    const fiveDaysAgo = moment().subtract(4, 'days').startOf('day');

    const counts = await Customer.aggregate([
      {
        $match: {
          isDeleted: false,
          createdAt: {
            $gte: fiveDaysAgo.toDate(),
            $lte: moment().endOf('day').toDate()
          }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: -1 }
      }
    ]);

    // Ensure all 5 days are included, even with 0
    const result = [];
    for (let i = 0; i < 5; i++) {
      const date = today.clone().subtract(i, 'days').format('YYYY-MM-DD');
      const found = counts.find(c => c._id === date);
      result.push({
        date,
        count: found ? found.count : 0
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Customer count for last 5 days fetched successfully.',
      data: result.reverse() // To show from oldest to newest
    });
  } catch (error) {
    console.error('Error fetching customer count:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

exports.createPreset = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    const newPreset = new Preset({
      name,
      createdBy: req.id,
    });

    await newPreset.save();
    res.status(201).json(newPreset);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.updatePreset = async (req, res) => {
  try {
    const { name, id } = req.body;  // Get both name and id from the request body

    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    if (!id) {
      return res.status(400).json({ message: "Preset ID is required" });
    }

    // Find the preset by ID (from request body)
    const preset = await Preset.findById({_id: id, isDeleted: false});
    if (!preset) {
      return res.status(404).json({ message: "Preset not found. Please check the provided ID." });
    }

    // Update the preset and set `editedBy` to the authenticated user's ID
    const updatedPreset = await Preset.findByIdAndUpdate(
      {_id: id},  // Use the ID from the request body
      { name, editedBy: req.id },  // Set editedBy to the authenticated user's ID
      { new: true }  // Return the updated document
    );

    return res.status(200).json({
      message: "Preset updated successfully", // Success message
      updatedPreset: updatedPreset
    });
  } catch (err) {
    return res.status(500).json({ message: "Error occurred while updating the preset. Please try again.", error: err.message });
  }
};

exports.deletePreset = async (req, res) => {
  try {
    const { id } = req.body;  // Preset ID is sent in the request body instead of the URL
    if (!id) {
      return res.status(400).json({ message: "Preset ID is required in the request body" });
    }

    const preset = await Preset.findById(id);
    if (!preset) {
      return res.status(404).json({ message: 'Preset not found' });
    }

    if (preset.isDeleted) {
      return res.status(400).json({ message: 'Preset is already deleted' });
    }

    // Perform soft delete by setting isDeleted to true and set editedBy to the request user ID
    const updatedPreset = await Preset.findByIdAndUpdate(
      {_id: id},
      { isDeleted: true, editedBy: req.id },
      { new: true }
    );

    res.status(200).json({ message: 'Preset deleted successfully', updatedPreset });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createPresetField = async (req, res) => {
  try {
    const presetFieldsArray = req.body; // Expecting an array

    // Validate that the request body is a non-empty array
    if (!Array.isArray(presetFieldsArray) || presetFieldsArray.length === 0) {
      return res.status(400).json({ message: "An array of preset fields must be provided" });
    }

    // Validate each item inside the array
    for (const field of presetFieldsArray) {
      if (!field.fieldsId || !field.fieldsFor) {
        return res.status(400).json({ message: "Each preset field must have fieldsId and fieldsFor" });
      }
    }

    // Add createdBy to each entry
    const dataToInsert = presetFieldsArray.map(item => ({
      ...item,
      createdBy: req.id, // Assuming req.id is populated after authentication
    }));

    // Insert multiple documents into database
    const savedPresetFields = await PresetFields.insertMany(dataToInsert);

    return res.status(201).json({
      message: "Preset fields created successfully",
      success: true,
      data: savedPresetFields,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error creating preset fields", error: err.message });
  }
};


exports.deletePresetFields = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ message: "Preset Field ID is required" });
    }

    const presetField = await PresetFields.findById(id);

    if (!presetField) {
      return res.status(404).json({ message: "PresetField not found" });
    }

    if (presetField.isDeleted) {
      return res.status(400).json({ message: "PresetField is already deleted" });
    }

    // Soft delete by setting isDeleted to true and updating the `editedBy` field with the authenticated user's ID
    const updatedPresetField = await PresetFields.findByIdAndUpdate(
      {_id: id},
      { isDeleted: true, editedBy: req.id },  // Assuming `req.user.id` is set by authentication middleware
      { new: true }
    );

    return res.status(200).json({
      message: "PresetField deleted successfully",
      success: true,
      updatedPresetField,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "An error occurred while deleting the PresetField", error: err.message });
  }
};

exports.getAllPresetsWithFields = async (req, res) => {
  try {
    const presets = await Preset.find({ isDeleted: false }).lean();

    if (!presets.length) {
      return res.status(404).json({ message: 'No presets found', success: false });
    }

    const presetsWithFields = await Promise.all(
      presets.map(async (preset) => {
        const presetFields = await PresetFields.find({
          presetId: preset._id,
          isDeleted: false
        }).lean();

        const formattedFields = await Promise.all(
          presetFields.map(async (field) => {
            let fieldData = null;

            if (field.fieldsFor === 'profile') {
              fieldData = await FormField.findOne({
                _id: field.fieldsId,
                isDeleted: false
              }).lean();

              if (fieldData) {
                return {
                  id: field.fieldsId,
                  Label: fieldData.attributeName,
                  Kind: "profile",
                  Field: fieldData.attributeType,
                  Required: field.isRequired,
                  AllowEdit: field.AllowEdit
                };
              }
            } else if (field.fieldsFor === 'Preferences') {
              fieldData = await PreferencesFields.findOne({
                _id: field.fieldsId,
                isDeleted: false
              }).lean();

              if (fieldData) {
                return {
                  id: field.fieldsId,
                  Label: fieldData.label,
                  Kind: "preference",
                  Field: fieldData.profileField,
                  Required: field.isRequired,
                  AllowEdit: field.AllowEdit
                };
              }
            }

            return null; // No matching field data found
          })
        );

        const finalFormattedFields = formattedFields.filter(Boolean); // remove nulls

        return {
          ...preset,
          fields: finalFormattedFields
        };
      })
    );

    return res.status(200).json({
      message: 'Presets with fields fetched successfully',
      success: true,
      data: presetsWithFields
    });

  } catch (error) {
    console.error('Error fetching presets with fields:', error);
    return res.status(500).json({
      message: 'Something went wrong',
      success: false,
      error: error.message
    });
  }
};

exports.getPresetById = async (req, res) => {
  try {
    const { presetId } = req.body;

    // Step 1: Get preset
    const preset = await Preset.findOne({ _id: presetId, isDeleted: false }).lean();

    console.log("preset::::::::", preset);

    if (!preset) {
      return res.status(404).json({ message: 'Preset not found', success: false });
    }

    // Step 2: Get all fields linked to this preset
    const presetFields = await PresetFields.find({
      presetId,
      isDeleted: false
    }).lean();

    // Step 3: Process each field to get metadata
    const formattedFields = await Promise.all(
      presetFields.map(async (field) => {
        let fieldData = null;

        if (field.fieldsFor === 'profile') {
          fieldData = await FormField.findOne({
            _id: field.fieldsId,
            isDeleted: false
          }).lean();

          if (fieldData) {
            return {
              id: field.fieldsId,
              Label: fieldData.attributeName,
              Kind: "profile",
              Field: fieldData.attributeType,
              Required: field.isRequired,
              AllowEdit: field.AllowEdit
            };
          }

        } else if (field.fieldsFor === 'Preferences') {
          fieldData = await PreferencesFields.findOne({
            _id: field.fieldsId,
            isDeleted: false
          }).lean();

          if (fieldData) {
            return {
              id: field.fieldsId,
              Label: fieldData.label,
              Kind: "preference",
              Field: fieldData.profileField,
              Required: field.isRequired,
              AllowEdit: field.AllowEdit
            };
          }
        }

        return null; // Skip if no match
      })
    );

    // Step 4: Clean nulls and return
    const finalFormattedFields = formattedFields.filter(Boolean);

    return res.status(200).json({
      message: 'Preset fetched successfully',
      success: true,
      data: {
        ...preset,
        fields: finalFormattedFields
      }
    });

  } catch (error) {
    console.error('Error fetching preset by ID:', error);
    return res.status(500).json({
      message: 'Something went wrong',
      success: false,
      error: error.message
    });
  }
};

exports.updatePresetField = async (req, res) => {
  try {
    const { presetFieldId, AllowEdit, isRequired } = req.body;

    // Validation
    if (!presetFieldId) {
      return res.status(400).json({ message: "presetFieldId is required", success: false });
    }

    if (typeof AllowEdit !== 'boolean' || typeof isRequired !== 'boolean') {
      return res.status(400).json({ 
        message: "AllowEdit and isRequired must be Boolean (true/false) values",
        success: false
      });
    }

    // Find the preset field
    const presetField = await PresetFields.findOne({ _id: presetFieldId, isDeleted: false });

    if (!presetField) {
      return res.status(404).json({ message: "PresetField not found", success: false });
    }

    // Update the fields
    presetField.AllowEdit = AllowEdit;
    presetField.isRequired = isRequired;
    presetField.editedBy = req.id; // Optionally track who edited it

    // Save updated preset field
    await presetField.save();

    return res.status(200).json({
      message: "PresetField updated successfully",
      success: true,
      data: presetField,
    });

  } catch (error) {
    console.error('Error updating PresetField:', error);
    return res.status(500).json({
      message: 'Something went wrong',
      success: false,
      error: error.message,
    });
  }
};

exports.createIntro = async (req, res) => {
  try {
    const { expiration, profileImage, fields, customerId } = req.body;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: "customerId is required",
      });
    }

    const validFieldsForValues = ["Preferences", "Profile"];
    const invalidFields = fields.filter(field => !validFieldsForValues.includes(field.fieldsFor));
    if (invalidFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid fieldsFor value. Only 'Preferences' or 'Profile' are allowed.`,
      });
    }

    const introCount = await Intro.countDocuments();
    const nextIntroId = (introCount + 1).toString().padStart(5, "0"); // Example: "00001"

    const introData = {
      introId: nextIntroId,
      customerId: customerId,
      createdAt: new Date(),
      sentCount: 0,
      viewed: 0,
      total: 0,
      expiration: expiration || new Date(),
      link: `http://pehlirasam.wayneesolutions.com/client/${nextIntroId}`,
      profileImage: profileImage || "default_image_path",
    };

    const newIntro = new Intro(introData);
    await newIntro.save();

    const introFieldsPromises = fields.map(async (field) => {
      const newField = new IntroFields({
        fieldId: field.fieldId,
        fieldsFor: field.fieldsFor,
        editedBy: field.editedBy,
        createdBy: field.createdBy,
        isDeleted: field.isDeleted || false,
        introId: newIntro._id,
      });

      return await newField.save();
    });

    await Promise.all(introFieldsPromises);

    res.status(201).json({
      success: true,
      message: "Intro and fields created successfully!",
      data: {
        intro: newIntro,
        fields: fields,
      },
    });
  } catch (error) {
    console.error("Error creating intro:", error);
    res.status(500).json({
      success: false,
      message: "Error creating intro and fields.",
      error: error.message,
    });
  }
};

exports.getIntroFieldValues = async (req, res) => {
  try {
    const { introId } = req.body;

    if (!introId) {
      return res.status(400).json({
        success: false,
        message: "introId is required in request body"
      });
    }

    // 1. Find intro by introId
    const intro = await Intro.findOne({ introId });
    if (!intro) {
      return res.status(404).json({
        success: false,
        message: "Intro not found"
      });
    }

    // 2. Fetch customer
    const customer = await Customer.findById(intro.customerId).select("firstName middelName lastName Number address.city");
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    const result = [];

    // 3. Add customer fields as "Profile" entries
    const customerFields = {
      firstName: customer.firstName,
      middelName: customer.middelName,
      lastName: customer.lastName,
      Number: customer.Number,
      city: customer?.address?.city || null
    };

    for (const [key, value] of Object.entries(customerFields)) {
      result.push({
        fieldName: key,
        value: value,
        fieldsFor: "Profile"
      });
    }

    // 4. Get linked intro fields
    const introFields = await IntroFields.find({ introId: intro._id });


    console.log("::::::::::::::::::::", introFields)

    for (const field of introFields) {
      let fieldName = "";
      let fieldValue = "";

      if (field.fieldsFor === "Profile") {
        const formField = await FormField.findById({_id: field.fieldId});
// console.log("formField::::::::::::::", field.fieldId)

        if (!formField) continue;
        fieldName = formField.attributeName;

        const valueDoc = await FormFieldsValue.findOne({
          fieldId: field.fieldId,
          customerId: intro.customerId,
        });
        fieldValue = valueDoc ? valueDoc.value : null;

      } else if (field.fieldsFor === "Preferences") {
        const prefField = await PreferencesFields.findById(field.fieldId);
        if (!prefField) continue;
        fieldName = prefField.label;

        const valueDoc = await PreferencesFieldsValue.findOne({
          preferencesFieldId: field.fieldId,
          customerId: intro.customerId,
        });
        fieldValue = valueDoc ? valueDoc.value : null;
      }

      result.push({
        fieldName,
        value: fieldValue,
        fieldsFor: field.fieldsFor
      });
    }

    res.status(200).json({
      success: true,
      intro,
      fields: result
    });

  } catch (error) {
    console.error("Error fetching intro field values:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

exports.getIntroSummaries = async (req, res) => {
  try {
    const intros = await Intro.find({ isDeleted: false })
      .populate("customerId", "firstName middelName lastName") // get only name fields
      .select("introId customerId createdAt sentCount viewed total")
      .lean();

    if (!intros.length) {
      return res.status(404).json({
        success: false,
        message: "No intros found"
      });
    }

    const result = intros.map((intro) => {
      const customer = intro.customerId;

      const fullName = [
        customer.firstName,
        customer.middelName,
        customer.lastName
      ]
        .filter(Boolean) // Remove undefined/null parts
        .join(" ");

      return {
        introId: intro.introId,
        customerName: fullName,
        createdAt: intro.createdAt,
        stats: `${intro.sentCount} sent / ${intro.viewed} viewed / ${intro.total} total`
      };
    });

    res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error("Error fetching intro summaries:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};



exports.updateIntroExpiration = async (req, res) => {
  try {
    const { introId, newExpiration } = req.body;

    if (!introId || !newExpiration) {
      return res.status(400).json({ message: "introId and newExpiration are required." });
    }

    const updatedIntro = await Intro.findOneAndUpdate(
      { introId, isDeleted: false },
      { expiration: newExpiration },
      { new: true }
    );

    if (!updatedIntro) {
      return res.status(404).json({ message: "Intro not found or has been deleted." });
    }

    return res.status(200).json({
      message: "Expiration date updated successfully.",
      data: updatedIntro
    });

  } catch (error) {
    console.error("Error updating expiration:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};





/////////////////////////    //////////////////////////



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
    const { name } = req.body;
    let customers;

    // If name is not provided, return all non-deleted, inactive customers
    if (!name || name.trim().length < 2) {
      customers = await Customer.find({
        isDeleted: false,
        // activeStatus: false
      });
    } else {
      // If "all" is passed as name, return all as well
      if (name.trim().toLowerCase() === "all") {
        customers = await Customer.find({
          isDeleted: false,
          // activeStatus: false
        });
      } else {
        const searchWords = name.trim().split(/\s+/);

        const nameConditions = searchWords.map(word => {
          const regex = new RegExp(word, 'i');
          return {
            $or: [
              { firstName: regex },
              { middelName: regex },
              { lastName: regex }
            ]
          };
        });

        customers = await Customer.find({
          isDeleted: false,
          // activeStatus: false,
          $and: nameConditions
        });
      }
    }

    res.status(200).json({
      success: true,
      message: "Customers fetched successfully",
      data: customers
    });

  } catch (error) {
    console.error("Error in getRecentlySubmittedClients:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

exports.getClientSubmissions = async (req, res) => {
    try {
        const count = await Customer.countDocuments({activeStatus: true});
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
                customerId: new mongoose.Types.ObjectId(customerId) // Converting to ObjectId
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

exports.getActivityLogs = async (req, res) => {
  try {
    const { customer } = req.body;

    if (!customer || customer.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide a customer ID or 'all'",
      });
    }

    let matchStage = {};

    if (customer.trim().toLowerCase() !== "all") {
      if (!mongoose.Types.ObjectId.isValid(customer)) {
        return res.status(400).json({
          success: false,
          message: "Invalid customer ID",
        });
      }
      matchStage.customerId = new mongoose.Types.ObjectId(customer);
    }

    const logs = await ActivityLog.aggregate([
      { $match: matchStage },

      // Lookup customer data
      {
        $lookup: {
          from: "customers",
          localField: "customerId",
          foreignField: "_id",
          as: "customerData"
        }
      },
      { $unwind: { path: "$customerData", preserveNullAndEmptyArrays: true } },

      // Lookup admin data
      {
        $lookup: {
          from: "admins",
          localField: "performedBy",
          foreignField: "_id",
          as: "performedBy"
        }
      },
      { $unwind: { path: "$performedBy", preserveNullAndEmptyArrays: true } },

      // Optionally project only necessary fields
      {
        $project: {
          action: 1,
          previousValue: 1,
          newValue: 1,
          createdAt: 1,
          updatedAt: 1,
          changeSummary:1,
          "customerData.firstName": 1,
          "customerData.lastName": 1,
          "customerData._id": 1,
          "performedBy.firstName": 1,
          "performedBy.lastName": 1,
          "performedBy._id": 1
        }
      },
      { $sort: { createdAt: -1 } }
    ]);

    res.status(200).json({
      success: true,
      message: "Activity logs fetched successfully",
      data: logs,
    });
  } catch (error) {
    console.error("Error in getActivityLogs:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.getMonthlyActivitySummary = async (req, res) => {
  try {
    const { customer } = req.body;

    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - 29); // Last 30 days including today

    let matchStage = {
      createdAt: {
        $gte: new Date(startDate.setHours(0, 0, 0, 0)),
        $lte: new Date(today.setHours(23, 59, 59, 999))
      }
    };

    if (customer && customer.trim().toLowerCase() !== "all") {
      if (!mongoose.Types.ObjectId.isValid(customer)) {
        return res.status(400).json({
          success: false,
          message: "Invalid customer ID",
        });
      }
      matchStage.customerId = new mongoose.Types.ObjectId(customer);
    }

    // Fetch activity logs grouped by date
    const rawData = await ActivityLog.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          count: 1
        }
      }
    ]);

    // Convert result into a Map for faster lookup
    const dataMap = new Map();
    rawData.forEach(item => dataMap.set(item.date, item.count));

    // Create final result for all 30 days
    const result = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      const dateStr = date.toISOString().split("T")[0];
      result.push({
        date: new Date(dateStr),
        count: dataMap.get(dateStr) || 0
      });
    }

    res.status(200).json({
      success: true,
      message: "30-day activity summary fetched",
      data: result,
    });

  } catch (error) {
    console.error("Error in getMonthlyActivitySummary:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};