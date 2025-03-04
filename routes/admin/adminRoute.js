const express = require('express');
const router = express.Router();
const {validateFormGroup, validateFormField } = require("../../validations/formValidation");


const {
  form_group,
  form_field,
form_group_List
} = require('../../controllers/admin/adminController');

// // Public routes
router.post("/createFromGroup", validateFormGroup, form_group);
router.post("/createFromField", validateFormField, form_field)
router.route('/getFromGroupList').get(form_group_List);


module.exports = router;
