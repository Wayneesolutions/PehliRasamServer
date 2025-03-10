const express = require('express');
const router = express.Router();
const {validateFormGroup, validateFormField } = require("../../validations/formValidation");
const {checkAdminToken} = require("../../middleware/authMiddleware")


const {
  create_admin,
  login_admin,
  updatePermission,
  updateNotification,
  form_group,
  form_field,
  form_group_List,
  getClientSubmissions,
  getRecentlySubmittedClients,
  getClientsAddedToday,
  getMatchingUsers,
  getCustomerProfile,
  getAllFieldsList,
  addCustomer,
  updateCustomer,
  reactivateCustomer
} = require('../../controllers/admin/adminController');

router.post("/adminCreation", create_admin);
router.post("/adminLogin", login_admin);
router.post("/updateAdminPermission", checkAdminToken, updatePermission);
router.post("/updateAdminNotification", checkAdminToken, updateNotification);
// router.post("/updateAdminBasic", checkAdminToken, updateBasic);

//
router.post("/createFromGroup", validateFormGroup, form_group);
router.post("/createFromField", validateFormField, form_field)
router.get("/clientsAddedToday", getClientsAddedToday)
router.post("/matchingUsers", getMatchingUsers)
router.post("/customerProfile", getCustomerProfile)
router.post("/fromFieldList", getAllFieldsList)
router.post("/addCustomer", addCustomer)
router.post("/updateCustomer", updateCustomer)
router.post("/deactiveCustomer", reactivateCustomer)

router.route('/getFromGroupList').get(form_group_List);
router.route('/clientSubmissions').get(getClientSubmissions);
router.route('/recentlySubmittedClients').get(getRecentlySubmittedClients);


module.exports = router;
