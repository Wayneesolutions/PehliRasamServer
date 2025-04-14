const mongoose = require("mongoose");
const Customer = require('../../models/customer/customerModel');
const FormFieldsValue = require("../../models/customer/clientAttributes/FromFieldValue");
const PreferencesFieldsValue = require("../../models/customer/preferencesAttributes/preferencesFieldsValue");
const FormField = require('../../models/customer/clientAttributes/FormField');
const FormGroup = require('../../models/customer/clientAttributes/FormGroup');
const PreferencesGroup = require("../../models/customer/preferencesAttributes/preferencesGroup");
const PreferencesFields = require("../../models/customer/preferencesAttributes/preferencesFields");
const {getGroupedAttributes, saveUserData} = require('../../utils/dbQueary')

const ErrorHandler = require('../../utils/errorHandler');

exports.getSubmissionFormById = async (req, res) => {
  try {
      const { formId } = req.body;

      // Validate request
      if (!formId) {
          return res.status(400).json({ error: "formId is required in the request body." });
      }

      // Find submission form by ID
      const form = await SubmissionForm.findById(formId)
          .populate("createdBy", "name email") // Populate user details
          .lean();

      if (!form) {
          return res.status(404).json({ error: "Submission form not found." });
      }

      // Fetch group data based on type
      let groupData = null;
      if (form.groupType === "FormGroup") {
          groupData = await FormGroup.findById(form.groupId).lean();
      } else if (form.groupType === "PreferencesGroup") {
          groupData = await PreferencesGroup.findById(form.groupId).lean();
      }

      // Fetch field data based on type
      let fieldData = null;
      if (form.fieldType === "FormField") {
          fieldData = await FormField.findById(form.fieldId).lean();
      } else if (form.fieldType === "PreferencesFields") {
          fieldData = await PreferencesFields.findById(form.fieldId).lean();
      }

      // Merge referenced data into response
      const responseData = {
          ...form,
          groupData: groupData || {},
          fieldData: fieldData || {}
      };

      res.status(200).json({
          message: "Submission form retrieved successfully",
          data: responseData
      });

  } catch (error) {
      console.error("Error fetching submission form:", error);
      res.status(500).json({ error: "Internal server error." });
  }
};

exports.createCustomer = async (req, res) => {
  try {

      const data = req.body;

      const Profile = {
          personalDetails: {
              fullName: data.personalDetails?.fullName || 'NAN',
              email: data.personalDetails?.email || 'NAN',
              contactNumber: data.personalDetails?.contactNumber || 'NAN',
              country: data.personalDetails?.country || 'NAN',
              location: data.personalDetails?.location || 'NAN'
          },
          matchPreferences: {
              preferredGender: data.matchPreferences?.preferredGender || 'NAN',
              preferredReligion: data.matchPreferences?.preferredReligion || 'NAN',
              preferredAgeRange: data.matchPreferences?.preferredAgeRange || 'NAN',
              preferredHeight: data.matchPreferences?.preferredHeight || 'NAN',
              caste: data.matchPreferences?.caste || 'NAN',
              cityPreferred: data.matchPreferences?.cityPreferred || 'NAN',
              preferredAppearance: data.matchPreferences?.preferredAppearance || 'NAN',
              maritalStatusPreference: data.matchPreferences?.maritalStatusPreference || 'NAN',
              educationPreference: data.matchPreferences?.educationPreference || 'NAN',
              employmentPreference: data.matchPreferences?.employmentPreference || 'NAN',
              vegetarianPreference: data.matchPreferences?.vegetarianPreference ?? false,
              drinkAlcohol: data.matchPreferences?.drinkAlcohol ?? false
          }
      };
      const dynamicField = {
          basicInformation: {
              gender: data.basicInformation?.gender || 'NAN',
              religion: data.basicInformation?.religion || 'NAN',
              maritalStatus: data.basicInformation?.maritalStatus || 'NAN',
              birthdate: data.basicInformation?.birthdate || new Date(),
              caste: data.basicInformation?.caste || 'NAN',
              height: data.basicInformation?.height || 'NAN'
          },
          educationProfession: {
              employment: data.educationProfession?.employment || 'NAN',
              education: data.educationProfession?.education || 'NAN'
          },
          familyDetails: {
              fatherName: data.familyDetails?.fatherName || 'NAN',
              motherName: data.familyDetails?.motherName || 'NAN'
          },
          aboutMe: {
              images: Array.isArray(data.aboutMe?.images) ? data.aboutMe.images : []
          },
      }


      const existingProfile = await Customer.findOne({ 'personalDetails.email': Profile.personalDetails.email });

      if (existingProfile) {
          return res.status(400).json({ error: 'Email already exists. Please use a different email.' });
      }

      const customer = new Customer(Profile);
      const inserCustomeBesicDetail = await customer.save();

      const customerId = inserCustomeBesicDetail._id || '67c830bc5b089a4a4d46b38c'

      const groupFieldList = await FormField.aggregate([
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
                  // attributePlaceHolder: "$attributePlaceHolder",
                  // attributeEnum: "$attributeEnum",
                  // attributeOption: "$attributeOption",
                  // createdAt: "$createdAt",
                  // updatedAt: "$updatedAt"
                }
              }
            }
          },
          {
            $sort: { "groupName": 1 } // Sort by group name (optional)
          }
        ]);

    const result = await saveUserData(customerId, dynamicField, groupFieldList[0])

      res.status(201).json({
          message: "Profile created successfully",
          data: result
      });
  } catch (error) {
      res.status(500).json({
          message: "Internal Server Error",
          error: error.message
      });
  }
}

exports.SubmissionFormDetail = async (req, res) => {
    // const session = await mongoose.startSession();
    // session.startTransaction();
  
    try {
    //   const createdBy = req.id;
      const {
        BasicDetail,
        ProfileDetails,
        matchDetails
      } = req.body;
  
      const customerData = {
        ...BasicDetail,
        // createdBy,
      };
  
      const newCustomer = await Customer.create([customerData]);
      const customerId = newCustomer[0]._id;
  
      for (let groupEntry of ProfileDetails) {
        const { group, fields } = groupEntry;
  
        const groupExists = await FormGroup.findById(group);
        if (!groupExists) {
          throw new Error(`FormGroup not found: ${group}`);
        }
  
        for (let field of fields) {
          const { fieldId, value } = field;
  
          const fieldExists = await FormField.findById(fieldId);
          if (!fieldExists) {
            throw new Error(`FormField not found: ${fieldId}`);
          }
  
          await FormFieldsValue.create([{
            groupId: group,
            fieldId : fieldId,
            value: value,
            customerId: customerId,
          }]);
        }
      }

  
      for (let groupEntry of matchDetails) {
        const { group, fields } = groupEntry;
  
        const groupExists = await PreferencesGroup.findById(group);
        if (!groupExists) {
          throw new Error(`PreferencesGroup not found: ${group}`);
        }
  
        for (let field of fields) {
          const { fieldId, value } = field;
  
          const fieldExists = await PreferencesFields.findById(fieldId);
          if (!fieldExists) {
            throw new Error(`PreferencesField not found: ${fieldId}`);
          }
  
          await PreferencesFieldsValue.create([{
            preferencesGroupId: group,
            preferencesFieldId: fieldId,
            value,
            customerId,
          }]);
        }
      }
  
    //   await session.commitTransaction();
    //   session.endSession();
  
      res.status(201).json({
        success: true,
        message: "Full submission saved successfully.",
        customerId,
      });
  
    } catch (error) {
    //   await session.abortTransaction();
    //   session.endSession();
  
      console.error("Error in full submission:", error);
      res.status(500).json({ error: error.message || "Internal server error." });
    }
  };

exports.findPotentialMatches = async (req, res) => {
  try {
    const { customerId } = req.body;

    if (!customerId || !mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing Customer ID"
      });
    }

    const customerObjectId = new mongoose.Types.ObjectId(customerId);

    // Step 1: Get gender of current user
    const genderFieldValue = await FormFieldsValue.findOne({ customerId: customerObjectId });

    if (!genderFieldValue || !genderFieldValue.value) {
      return res.status(400).json({
        success: false,
        message: "Gender not found for this customer"
      });
    }

    const gender = genderFieldValue.value.toLowerCase();
    const oppositeGender = gender === "male" ? "female" : "male";

    // Step 2: Get all customerIds of opposite gender
    const oppositeGenderIds = await FormFieldsValue.find({
      value: new RegExp(`^${oppositeGender}$`, "i")
    }).distinct("customerId");

    if (!oppositeGenderIds.length) {
      return res.status(404).json({
        success: false,
        message: "No users found with opposite gender"
      });
    }

    // Step 3: Get all necessary data
    const groups = await FormGroup.find({ isDeleted: false, isActive: true });
    const fields = await FormField.find({ isDeleted: false, isActive: true });

    const allValues = await FormFieldsValue.find({ customerId: { $in: oppositeGenderIds } });

    // Step 4: Build response for each opposite gender customer
    const oppositeUsers = await Customer.find({ _id: { $in: oppositeGenderIds } });

    const results = oppositeUsers.map(user => {
      const customerId = user._id.toString();
      const userValues = allValues.filter(val => val.customerId.toString() === customerId);

      const dynamicFields = groups.map(group => {
        const groupFields = fields.filter(field => field.form_group_id.toString() === group._id.toString());

        if (groupFields.length === 0) return null;

        return {
          groupId: group._id,
          groupName: group.name,
          fields: groupFields.map(field => {
            const fieldValue = userValues.find(val => val.fieldId.toString() === field._id.toString());
            return {
              fieldId: field._id,
              fieldName: field.attributeName,
              attributeType: field.attributeType,
              attributeOption: field.attributeOption,
              value: fieldValue ? fieldValue.value : "NaN"
            };
          })
        };
      }).filter(Boolean);

      return {
        customerId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        imagePath: user.imagePath,
        dynamicFields
      };
    });

    res.status(200).json({
      success: true,
      message: "Opposite gender profiles retrieved successfully",
      data: results
    });

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
};
  