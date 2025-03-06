const Customer = require('../models/customer/customerModel');

async function findMatchingUsers(sourceUserId) {
    try {
        const sourceUser = await Customer.findById({_id: sourceUserId});

        if (!sourceUser) {
            throw new Error('User not found');
        }

        const preferences = sourceUser.matchPreferences;

        // Building query based on matchPreferences (dynamic query creation)
        const query = {
            'basicInformation.gender': preferences.preferredGender,
            'basicInformation.religion': preferences.preferredReligion !== 'NAN' ? preferences.preferredReligion : { $exists: true },
            'basicInformation.height': preferences.preferredHeight !== 'NAN' ? preferences.preferredHeight : { $exists: true },
            'basicInformation.maritalStatus': preferences.maritalStatusPreference !== 'NAN' ? preferences.maritalStatusPreference : { $exists: true },
            'educationProfession.education': preferences.educationPreference !== 'NAN' ? preferences.educationPreference : { $exists: true },
            'educationProfession.employment': preferences.employmentPreference !== 'NAN' ? preferences.employmentPreference : { $exists: true },
            'basicInformation.caste': preferences.caste !== 'NAN' ? preferences.caste : { $exists: true },
            'personalDetails.location': preferences.cityPreferred !== 'NAN' ? preferences.cityPreferred : { $exists: true },
            'matchPreferences.vegetarianPreference': preferences.vegetarianPreference,
            'matchPreferences.drinkAlcohol': preferences.drinkAlcohol
        };

        // Handle Age Range Filter
        // if (preferences.preferredAgeRange && preferences.preferredAgeRange !== 'NAN') {
        //     const [minAge, maxAge] = preferences.preferredAgeRange.split('-').map(Number);
        //     const currentDate = new Date();

        //     const minBirthdate = new Date();
        //     minBirthdate.setFullYear(currentDate.getFullYear() - maxAge);

        //     const maxBirthdate = new Date();
        //     maxBirthdate.setFullYear(currentDate.getFullYear() - minAge);

        //     query['basicInformation.birthdate'] = { $gte: minBirthdate, $lte: maxBirthdate };
        // }

        // Exclude the source user themselves from the results
        const matchingUsers = await Customer.find({ 
            _id: { $ne: sourceUserId }, 
            ...query 
        });

        return matchingUsers;

    } catch (error) {
        throw new Error(`Failed to find matching users: ${error.message}`);
    }
}

module.exports = {
    findMatchingUsers
};
