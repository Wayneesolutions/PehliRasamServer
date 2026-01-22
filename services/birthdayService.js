const Customer = require("../models/customer/customerModel");
const FormGroup = require("../models/customer/clientAttributes/FormGroup");
const FormField = require("../models/customer/clientAttributes/FormField");
const FormFieldsValue = require("../models/customer/clientAttributes/FromFieldValue");

/**
 * Get all customers whose birthday is today
 * @returns {Promise<Array>} Array of customers with their email and name
 */
const getCustomersWithBirthdayToday = async () => {
  try {
    // Get all active customers
    const customers = await Customer.find({
      activeStatus: true,
      isDeleted: false,
      email: { $exists: true, $ne: null, $ne: "" }
    }).select("_id firstName middelName lastName email");

    if (customers.length === 0) {
      return [];
    }

    // Get all active fields to find birthday field
    const fields = await FormField.find({ isDeleted: false, isActive: true });
    
    // Find birthday field (case-insensitive search)
    const birthdayField = fields.find(field => 
      field.attributeName && 
      field.attributeName.toLowerCase().includes('birthday')
    );

    if (!birthdayField) {
      console.log("No birthday field found in FormField collection");
      return [];
    }

    // Get today's date
    const today = new Date();
    const todayMonth = today.getMonth(); // 0-11
    const todayDate = today.getDate(); // 1-31

    const customersWithBirthday = [];

    // Check each customer's birthday
    for (const customer of customers) {
      try {
        // Get customer's profile values
        const birthdayValue = await FormFieldsValue.findOne({
          customerId: customer._id,
          fieldId: birthdayField._id
        });

        if (!birthdayValue || !birthdayValue.value || birthdayValue.value === "NaN") {
          continue; // Skip if no birthday value
        }

        // Parse birthday date
        let birthdayDate;
        try {
          birthdayDate = new Date(birthdayValue.value);
          
          // Validate date
          if (isNaN(birthdayDate.getTime())) {
            console.log(`Invalid birthday date for customer ${customer._id}: ${birthdayValue.value}`);
            continue;
          }
        } catch (dateError) {
          console.log(`Error parsing birthday date for customer ${customer._id}: ${birthdayValue.value}`);
          continue;
        }

        // Check if birthday matches today (month and day)
        if (birthdayDate.getMonth() === todayMonth && birthdayDate.getDate() === todayDate) {
          const fullName = `${customer.firstName || ''} ${customer.middelName || ''} ${customer.lastName || ''}`.trim();
          
          customersWithBirthday.push({
            customerId: customer._id,
            email: customer.email,
            firstName: customer.firstName,
            lastName: customer.lastName,
            fullName: fullName || customer.firstName || 'Valued Client',
            birthday: birthdayValue.value
          });
        }
      } catch (error) {
        console.error(`Error processing customer ${customer._id}:`, error.message);
        continue; // Continue with next customer
      }
    }

    return customersWithBirthday;
  } catch (error) {
    console.error("Error in getCustomersWithBirthdayToday:", error);
    throw error;
  }
};

module.exports = {
  getCustomersWithBirthdayToday
};

