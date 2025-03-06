const express = require('express');
const router = express.Router();
const {validateFormGroup, validateFormField } = require("../../validations/formValidation");


const {
  form_group,
  form_field,
form_group_List,
getClientSubmissions,
getRecentlySubmittedClients,
getClientsAddedToday,
getMatchingUsers,
getCustomerProfile
} = require('../../controllers/admin/adminController');

// // Public routes
router.post("/createFromGroup", validateFormGroup, form_group);
router.post("/createFromField", validateFormField, form_field)
router.get("/clientsAddedToday", getClientsAddedToday)
router.post("/matchingUsers", getMatchingUsers)
router.post("/customerProfile", getCustomerProfile)

router.route('/getFromGroupList').get(form_group_List);
router.route('/clientSubmissions').get(getClientSubmissions);
router.route('/recentlySubmittedClients').get(getRecentlySubmittedClients);


module.exports = router;
