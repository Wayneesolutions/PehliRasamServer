const express = require('express');
const router = express.Router();
// const {validateFormGroup, validateFormField } = require("../../validations/formValidation");
// const {upload} = require('../../config/awsConfig');
const multer = require('multer');
const fs = require('fs');
const path = require('path');


const {checkAdminToken} = require("../../middleware/authMiddleware")
const FileUpload  = require("../../middleware/upload")


const {
  create_admin,
  login_admin,
  updatePermission,
  updateNotification,
  updateBasicDetails,
  getAdminDetail,
  getAdminList,
  deactiveAdmin,
  createFromGroup,
  updateFromGroup,
  deleteFromGroup,
  getFromGroupList,
  createFromField,
  updateFormField,
  changeFormFieldGroup,
  deleteFormField,
  allGroupFieldList,

  createFieldType,
  getAllFieldTypeList,

  addCustomerByAdmin, //
  fetchCustomerFieldGroups,
  fetchPreferencesFieldGroups,
  updateCustomerBasicDetail, //. add log
  updateCustomerProfile, // add log
  updateCustomerMatchPreferences, // add log
  allActiveCustomer,
  getCustomerBasicDetail,
  getCustomerProfileDetail,
  getCustomerMatchPreferencesDetail,

  getMatchGroupDetails,
  getMatchingSuggestions,


  uploadFile,

  createClientList,
  getAllClientLists,
  editClientList,
  removeClientList,
  addCustomerToClientList,
  removeCustomerFromClientList,

  createPreferencesGroup,
  updatePreferencesGroup,
  deletePreferencesGroup,
  getPreferencesGroupList,
  createPreferencesField,
  updatePreferencesField,
  changePreferencesFieldGroup,
  deletePreferencesField,
  getAllPreferencesGroupFields,
  searchCustomerByName,

  submissionForm, //
  getSubmissionFormById,
  updateSubmissionForm,

  form_group_List,
  getClientSubmissions,
  getRecentlySubmittedClients,
  getMatchingUsers,
  getCustomerProfile,
  getAllFieldsList,
  addCustomer,
  reactivateCustomer,

  createMatchGroup,
  updateMatchGroupName,
  deleteMatchGroup,
  getAllMatchGroups,
  createMatchGroupValue,
  updateMatchGroupValue,
  deleteMatchGroupValue,
  // getMatchGroupValues,
  addCustomerPhoto,
  deleteCustomerPhoto,

  createEmailTemplate,
  getAllEmailTemplates,
  deleteEmailTemplate,
  updateEmailTemplate,
  getEmailTemplateById,
  sendCustomerMail, //add log
  getMailLogs,
  getTodayStatsCount,
  getCustomerCountLastFiveDays,
  getActivityLogs,
  getMonthlyActivitySummary,
  createPreset,
  updatePreset,
  deletePreset,
  createPresetField,
  deletePresetFields,
  getAllPresetsWithFields,
  updatePresetField,
  createIntro,
  getIntroFieldValues,
  updateIntroExpiration,
  getPresetById,
  getIntroSummaries,
  sendMailForIntro
  // searchMailLogs
} = require('../../controllers/admin/adminController');


//multer

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/tiff', 'image/jpg'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, TIFF, and JPG allowed.'), false);
  }
};

// Use memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage, fileFilter });

router.post("/adminCreation", create_admin);
router.post("/adminLogin", login_admin);
router.post("/updateAdminPermission", checkAdminToken, updatePermission);
router.post("/updateAdminNotification", checkAdminToken, updateNotification);
router.post("/updateAdminBasicDetails", checkAdminToken, updateBasicDetails);
router.post("/adminDetail", checkAdminToken, getAdminDetail);
router.get("/adminList", checkAdminToken, getAdminList);
router.post("/deleteAdmin", checkAdminToken, deactiveAdmin);

//
router.post("/createFromGroup",checkAdminToken, createFromGroup);
router.post("/updateFromGroup",checkAdminToken, updateFromGroup);
router.post("/deleteFromGroup",checkAdminToken, deleteFromGroup);
router.get("/allFromGroupList",checkAdminToken, getFromGroupList);


router.post("/createFromField",checkAdminToken, createFromField)
router.post("/updateFormField",checkAdminToken, updateFormField);
router.post("/changeFormFieldGroup",checkAdminToken, changeFormFieldGroup);
router.post("/deleteFormField",checkAdminToken, deleteFormField);
// router.post("/fieldList",checkAdminToken, fieldList);


router.get("/getFromGroupList",checkAdminToken, allGroupFieldList);


router.post("/createFieldType",checkAdminToken, createFieldType);
router.get("/allFieldTypeList",checkAdminToken, getAllFieldTypeList);


// // Preferences Group Routes
router.post("/createPreferencesGroup", checkAdminToken, createPreferencesGroup);
router.post("/updatePreferencesGroup", checkAdminToken, updatePreferencesGroup);
router.post("/deletePreferencesGroup", checkAdminToken, deletePreferencesGroup);
router.get("/allPreferencesGroupList", checkAdminToken, getPreferencesGroupList);

// // Preferences Field Routes
router.post("/createPreferencesField", checkAdminToken, createPreferencesField);
router.post("/updatePreferencesField", checkAdminToken, updatePreferencesField);
router.post("/changePreferencesFieldGroup", checkAdminToken, changePreferencesFieldGroup);
router.post("/deletePreferencesField", checkAdminToken, deletePreferencesField);

// // Get All Group Fields
router.get("/getAllPreferencesGroupFields", checkAdminToken, getAllPreferencesGroupFields);


router.post("/addCustomerByAdmin",checkAdminToken, addCustomerByAdmin)
router.get("/fetchCustomerFieldGroups",checkAdminToken, fetchCustomerFieldGroups)
router.get("/fetchPreferencesFieldGroups",checkAdminToken, fetchPreferencesFieldGroups)
// router.post("/updateCustomerByAdmin",checkAdminToken, updateCustomerByAdmin)
router.post("/updateCustomerBasicDetail",checkAdminToken, updateCustomerBasicDetail)
router.post("/updateCustomerProfile",checkAdminToken, updateCustomerProfile)
router.post("/updateCustomerMatchPreferences",checkAdminToken, updateCustomerMatchPreferences)
router.post("/deleteCustomer", checkAdminToken, reactivateCustomer)
router.post("/customerProfile", checkAdminToken, getCustomerProfile)
router.get("/allActiveCustomer", checkAdminToken, allActiveCustomer)
router.post("/getCustomerBasicDetail", checkAdminToken, getCustomerBasicDetail)
router.post("/getCustomerProfileDetail", checkAdminToken, getCustomerProfileDetail)
router.post("/getCustomerMatchPreferencesDetail", checkAdminToken, getCustomerMatchPreferencesDetail)
router.post("/getMatchGroupDetails", checkAdminToken, getMatchGroupDetails)
router.post("/searchCustomerByName", checkAdminToken, searchCustomerByName)
router.post("/addCustomerPhoto", checkAdminToken, addCustomerPhoto)
router.post("/deleteCustomerPhoto", checkAdminToken, deleteCustomerPhoto)


router.post("/addCustomerToClientList", checkAdminToken, addCustomerToClientList)
router.post("/removeCustomerFromClientList", checkAdminToken, removeCustomerFromClientList)


router.post("/upload", upload.array("file"), uploadFile);


router.post("/createClientList", checkAdminToken, createClientList)
router.get("/getAllClientLists", checkAdminToken, getAllClientLists)
router.post("/editClientList", checkAdminToken, editClientList)
router.post("/removeClientList", checkAdminToken, removeClientList)


router.post('/createSubmissionForm',checkAdminToken, submissionForm);
router.post('/SubmissionFormById', getSubmissionFormById);
router.post('/updateSubmissionForm',checkAdminToken, updateSubmissionForm);


router.post("/createMatchGroup", checkAdminToken, createMatchGroup);
router.post("/updateMatchGroupName", checkAdminToken, updateMatchGroupName);
router.post("/deleteMatchGroup", checkAdminToken, deleteMatchGroup);
router.get("/getAllMatchGroups", checkAdminToken, getAllMatchGroups);
router.post("/createMatchGroupValue", checkAdminToken, createMatchGroupValue);
router.post("/updateMatchGroupValue", checkAdminToken, updateMatchGroupValue);
router.post("/deleteMatchGroupValue", checkAdminToken, deleteMatchGroupValue);
// router.get("/getMatchGroupValues", checkAdminToken, getMatchGroupValues);


router.post("/matchingSuggestions", checkAdminToken, getMatchingSuggestions);

router.post("/createEmailTemplate", checkAdminToken, createEmailTemplate)
router.get("/getAllEmailTemplates", checkAdminToken, getAllEmailTemplates)
router.post("/deleteEmailTemplate", checkAdminToken, deleteEmailTemplate)
router.post("/updateEmailTemplate", checkAdminToken, updateEmailTemplate)
router.post("/getEmailTemplateById", checkAdminToken, getEmailTemplateById)


router.post("/sendCustomerMail", checkAdminToken, sendCustomerMail)
router.post("/sendMailForIntro", checkAdminToken, sendMailForIntro)
router.post("/mailLogs", checkAdminToken, getMailLogs)
// router.get("/searchMailLogs", checkAdminToken, searchMailLogs)



router.get("/getTodayStatsCount",checkAdminToken, getTodayStatsCount)
router.get("/getRecentlySubmittedClients",checkAdminToken, getRecentlySubmittedClients)
router.get("/getCustomerCountLastFiveDays",checkAdminToken, getCustomerCountLastFiveDays)

router.post("/matchingUsers", getMatchingUsers)
router.post("/fromFieldList", getAllFieldsList)
router.post("/addCustomer", addCustomer)
// router.post("/updateCustomer", updateCustomer)getTodayStatsCount


router.post("/getActivityLogs", checkAdminToken, getActivityLogs)
router.post("/getMonthlyActivitySummary", checkAdminToken, getMonthlyActivitySummary)

// router.route('/getFromGroupList').get(form_group_List);
router.route('/clientSubmissions').get(getClientSubmissions);
router.route('/recentlySubmittedClients').get(getRecentlySubmittedClients);


router.post("/createPreset", checkAdminToken, createPreset);
router.post("/updatePreset", checkAdminToken, updatePreset);
router.post("/deletePreset", checkAdminToken, deletePreset);
router.post("/createPresetField", checkAdminToken, createPresetField);
router.post("/deletePresetFields", checkAdminToken, deletePresetFields);
router.get("/getAllPresetsWithFields", checkAdminToken, getAllPresetsWithFields);
router.post("/updatePresetField", checkAdminToken, updatePresetField);
router.post("/getPresetById", checkAdminToken, getPresetById);

router.post("/createIntro", checkAdminToken, createIntro);
router.post("/getIntroFieldValues", getIntroFieldValues);
router.get("/getAllIntroSummaries", checkAdminToken, getIntroSummaries);
router.post("/updateIntroExpiration", checkAdminToken, updateIntroExpiration);






module.exports = router;
