const Customer = require('../../models/customer/customerModel');
const FormField = require('../../models/customer/clientAttributes/FormField');
const FormGroup = require('../../models/customer/clientAttributes/FormGroup');
const {getGroupedAttributes, saveUserData} = require('../../utils/dbQueary')

const ErrorHandler = require('../../utils/errorHandler');


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