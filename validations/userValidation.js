// const { check } = require('express-validator');

// const profileValidationRules = [
//     // Personal Details
//     check('personalDetails.fullName').trim().notEmpty().withMessage('Full Name is required'),
//     check('personalDetails.email').isEmail().withMessage('Valid email is required'),
//     check('personalDetails.contactNumber').matches(/^\d{10,15}$/).withMessage('Contact number must be 10 to 15 digits'),
//     check('personalDetails.country').notEmpty().withMessage('Country is required'),
//     check('personalDetails.location').notEmpty().withMessage('Location is required'),

//     // Basic Information
//     check('basicInformation.gender').isIn(['Male', 'Female', 'Other']).withMessage('Invalid gender'),
//     check('basicInformation.birthdate').isISO8601().withMessage('Valid birthdate is required'),

//     // Education & Profession
//     check('educationProfession.employment').notEmpty().withMessage('Employment is required'),
//     check('educationProfession.education').notEmpty().withMessage('Education is required'),

//     // Family Details
//     check('familyDetails.fatherName').notEmpty().withMessage('Father\'s name is required'),
//     check('familyDetails.motherName').notEmpty().withMessage('Mother\'s name is required'),

//     // About Me
//     check('aboutMe.images').optional().isArray().withMessage('Images must be an array'),
//     check('aboutMe.images.*').optional().isURL().withMessage('Each image must be a valid URL'),

//     // Match Preferences
//     check('matchPreferences.preferredAgeRange')
//         .optional()
//         .matches(/^\d{2}-\d{2}$/).withMessage('Preferred Age Range must be like "25-30"')
// ];

// module.exports = profileValidationRules;


const { checkSchema, validationResult } = require('express-validator');

const validateProfile = [
    checkSchema({
        'personalDetails.fullName': {
            notEmpty: true,
            errorMessage: 'Full Name is required'
        },
        'personalDetails.email': {
            isEmail: true,
            errorMessage: 'Valid email is required'
        },
        'personalDetails.contactNumber': {
            isLength: {
                options: { min: 10, max: 15 }
            },
            errorMessage: 'Contact number should be 10-15 digits'
        },
        'personalDetails.country': {
            notEmpty: true,
            errorMessage: 'Country is required'
        },
        'personalDetails.location': {
            notEmpty: true,
            errorMessage: 'Location is required'
        },

        'basicInformation.gender': {
            notEmpty: true,
            errorMessage: 'Gender is required'
        },
        'basicInformation.religion': {
            optional: true
        },
        'basicInformation.maritalStatus': {
            optional: true
        },
        'basicInformation.birthdate': {
            isISO8601: true,
            errorMessage: 'Birthdate should be in YYYY-MM-DD format'
        },
        'basicInformation.caste': {
            optional: true
        },
        'basicInformation.height': {
            notEmpty: true,
            errorMessage: 'Height is required'
        },

        'educationProfession.employment': {
            notEmpty: true,
            errorMessage: 'Employment/Job is required'
        },
        'educationProfession.education': {
            notEmpty: true,
            errorMessage: 'Education is required'
        },

        'familyDetails.fatherName': {
            notEmpty: true,
            errorMessage: 'Father\'s Name is required'
        },
        'familyDetails.motherName': {
            notEmpty: true,
            errorMessage: 'Mother\'s Name is required'
        },

        'aboutMe.images': {
            isArray: true,
            optional: true,
            errorMessage: 'Images should be an array of URLs'
        },

        'matchPreferences.preferredGender': {
            notEmpty: true,
            errorMessage: 'Preferred Gender is required'
        },
        'matchPreferences.preferredReligion': {
            optional: true
        },
        'matchPreferences.preferredAgeRange.min': {
            notEmpty: {
                errorMessage: 'Preferred Age Range (min) is required'
            },
            isNumeric: {
                errorMessage: 'Preferred Age Range (min) should be a number'
            },
            toInt: true,
            custom: {
                options: (value) => value >= 18 && value <= 100,
                errorMessage: 'Preferred Age Range (min) should be between 18 and 100'
            }
        },
        'matchPreferences.preferredAgeRange.max': {
            notEmpty: {
                errorMessage: 'Preferred Age Range (max) is required'
            },
            isNumeric: {
                errorMessage: 'Preferred Age Range (max) should be a number'
            },
            toInt: true,
            custom: {
                options: (value) => value >= 18 && value <= 100,
                errorMessage: 'Preferred Age Range (max) should be between 18 and 100'
            }
        },
        'matchPreferences.preferredHeight.min': {
            optional: true,
            isNumeric: {
                errorMessage: 'Height min should be a number'
            },
            toInt: true,
            custom: {
                options: (value) => value >= 100 && value <= 250,
                errorMessage: 'Height min should be between 100 and 250 cm'
            }
        },
        'matchPreferences.preferredHeight.max': {
            optional: true,
            isNumeric: {
                errorMessage: 'Height max should be a number'
            },
            toInt: true,
            custom: {
                options: (value) => value >= 100 && value <= 250,
                errorMessage: 'Height max should be between 100 and 250 cm'
            }
        },
        'matchPreferences.caste': {
            optional: true
        },
        'matchPreferences.cityPreferred': {
            optional: true
        },
        'matchPreferences.preferredAppearance': {
            optional: true
        },
        'matchPreferences.maritalStatusPreference': {
            optional: true
        },
        'matchPreferences.educationPreference': {
            optional: true
        },
        'matchPreferences.employmentPreference': {
            optional: true
        },
        'matchPreferences.vegetarianPreference': {
            isBoolean: true,
            errorMessage: 'Vegetarian Preference must be boolean'
        },
        'matchPreferences.drinkAlcohol': {
            isBoolean: true,
            errorMessage: 'Drink Alcohol must be boolean'
        }
    }),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

module.exports = { validateProfile };
