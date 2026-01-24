const FormFieldsValue = require("../models/customer/clientAttributes/FromFieldValue");
const FormField = require("../models/customer/clientAttributes/FormField");
const FormGroup = require("../models/customer/clientAttributes/FormGroup");
const Customer = require("../models/customer/customerModel");
const MailLog = require("../models/customer/mail/mailLog");

/**
 * Get customers whose membership expires in exactly 10 days
 * @returns {Promise<Array>} Array of customers with membership info
 */
const getCustomersWithExpiringMembership = async () => {
  try {
    // 1. Find the Membership Information group
    const membershipGroup = await FormGroup.findOne({ 
      name: /membership information/i,
      isDeleted: false 
    });
    
    if (!membershipGroup) {
      console.log("⚠️ Membership Information group not found");
      return [];
    }

    // 2. Find the duration field - search by common patterns
    let durationField = await FormField.findOne({
      form_group_id: membershipGroup._id,
      $or: [
        { attributeName: /duration/i },
        { attributeName: /membership.*duration/i },
        { attributeName: /membership.*period/i },
        { attributeName: /membership.*month/i }
      ],
      isDeleted: false,
      isActive: true
    });

    // If not found by pattern, try to find by field type and options (select with 1-10 values)
    if (!durationField) {
      const allFields = await FormField.find({
        form_group_id: membershipGroup._id,
        isDeleted: false,
        isActive: true
      });

      // Look for select fields with numeric options (1-10)
      for (const field of allFields) {
        if (field.attributeType === 'select' && field.attributeOption && field.attributeOption.length > 0) {
          const options = field.attributeOption.map(opt => parseInt(opt)).filter(opt => !isNaN(opt) && opt >= 1 && opt <= 10);
          if (options.length >= 5) { // Likely a duration field if it has 5+ numeric options 1-10
            durationField = field;
            console.log(`✅ Found duration field by pattern matching: ${field.attributeName} (${field._id})`);
            break;
          }
        }
      }
    }

    if (!durationField) {
      console.log("⚠️ Membership duration field not found. Please ensure a duration field exists in the Membership Information group.");
      return [];
    }

    console.log(`✅ Using duration field: ${durationField.attributeName} (${durationField._id})`);

    // 3. Find the Membership Type field
    const membershipTypeField = await FormField.findOne({
      form_group_id: membershipGroup._id,
      $or: [
        { attributeName: /membership.*type/i },
        { attributeName: /^membership type$/i }
      ],
      isDeleted: false,
      isActive: true
    });

    if (!membershipTypeField) {
      console.log("⚠️ Membership Type field not found. Please ensure a 'Membership Type' field exists in the Membership Information group.");
      return [];
    }

    console.log(`✅ Using membership type field: ${membershipTypeField.attributeName} (${membershipTypeField._id})`);

    // Define paid membership types (case-insensitive matching)
    const paidMembershipTypes = [
      "Active Client",
      "Old Paid Member"
    ];

    // Helper function to check if membership type is paid
    const isPaidMembership = (membershipType) => {
      if (!membershipType) return false;
      const normalizedType = membershipType.trim();
      return paidMembershipTypes.some(paidType => 
        paidType.toLowerCase() === normalizedType.toLowerCase()
      );
    };

    // 4. Get all customers with duration values
    const durationValues = await FormFieldsValue.find({
      groupId: membershipGroup._id,
      fieldId: durationField._id
    }).populate({
      path: 'customerId',
      select: 'firstName middelName lastName email activeStatus isDeleted',
      match: { 
        activeStatus: true,
        isDeleted: false,
        email: { $exists: true, $ne: null, $ne: "" }
      }
    });

    // 5. Calculate expiration dates and filter for 10 days from now
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + 10); // 10 days from now
    targetDate.setHours(0, 0, 0, 0); // Start of target day

    const tomorrow = new Date(targetDate);
    tomorrow.setDate(targetDate.getDate() + 1); // Start of next day (end of target day)

    const expiringCustomers = [];

    for (const durationValue of durationValues) {
      try {
        const customer = durationValue.customerId;
        
        // Skip if customer is null (populate filter removed inactive/deleted)
        if (!customer) {
          continue;
        }

        // Skip if no email
        if (!customer.email || customer.email === "NaN" || customer.email.trim() === "") {
          continue;
        }

        // 6. Check Membership Type - only proceed if it's a paid membership
        const membershipTypeValue = await FormFieldsValue.findOne({
          customerId: customer._id,
          groupId: membershipGroup._id,
          fieldId: membershipTypeField._id
        });

        if (!membershipTypeValue || !membershipTypeValue.value) {
          console.log(`⏭️ Skipping ${customer.email} - No membership type found`);
          continue;
        }

        const membershipType = membershipTypeValue.value.trim();
        if (!isPaidMembership(membershipType)) {
          console.log(`⏭️ Skipping ${customer.email} - Membership type is not paid (${membershipType})`);
          continue;
        }

        console.log(`✅ ${customer.email} has paid membership type: ${membershipType}`);

        // Parse duration (should be 1-10)
        const durationMonths = parseInt(durationValue.value);
        if (isNaN(durationMonths) || durationMonths < 1 || durationMonths > 10) {
          continue;
        }

        // Calculate expiration date: start date + duration
        // Use createdAt of FormFieldsValue as membership start date
        const startDate = new Date(durationValue.createdAt);
        startDate.setHours(0, 0, 0, 0);
        
        const expirationDate = new Date(startDate);
        expirationDate.setMonth(startDate.getMonth() + durationMonths);
        expirationDate.setHours(23, 59, 59, 999); // End of expiration day

        // Check if expiration is exactly 10 days from now (within the target day)
        if (expirationDate >= targetDate && expirationDate < tomorrow) {
          // Check if reminder already sent today (prevent duplicates)
          const todayStart = new Date(today);
          todayStart.setHours(0, 0, 0, 0);
          
          const existingReminder = await MailLog.findOne({
            customer: customer._id,
            subject: /membership.*renewal|renewal.*reminder/i,
            sentAt: {
              $gte: todayStart
            }
          });

          if (existingReminder) {
            console.log(`⏭️ Reminder already sent to ${customer.email} today`);
            continue;
          }

          const fullName = `${customer.firstName || ''} ${customer.middelName || ''} ${customer.lastName || ''}`.trim();
          
          expiringCustomers.push({
            customerId: customer._id,
            email: customer.email,
            firstName: customer.firstName,
            lastName: customer.lastName,
            fullName: fullName || customer.firstName || 'Valued Client',
            durationMonths,
            startDate: startDate.toISOString(),
            expirationDate: expirationDate.toISOString()
          });
        }
      } catch (error) {
        console.error(`❌ Error processing customer ${durationValue.customerId}:`, error.message);
        continue;
      }
    }

    console.log(`📊 Found ${expiringCustomers.length} customer(s) with memberships expiring in 10 days`);
    return expiringCustomers;
  } catch (error) {
    console.error("❌ Error in getCustomersWithExpiringMembership:", error);
    throw error;
  }
};

module.exports = {
  getCustomersWithExpiringMembership
};

