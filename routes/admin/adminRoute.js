const express = require('express');
const router = express.Router();
// const {validateFormGroup, validateFormField } = require("../../validations/formValidation");
// const {upload} = require('../../config/awsConfig');
const multer = require('multer');
const fs = require('fs');
const path = require('path');


const {checkAdminToken} = require("../../middleware/authMiddleware")


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


//multer

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/tiff', 'image/jpg'];
  if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
  } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, TIFF, and JPG files are allowed.'), false);
  }
};
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
      const uploadPath = path.join(__dirname, '../../uploads');
      // Create directory if it doesn't exist
      if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
      cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter
});

router.post("/adminCreation", create_admin);
router.post("/adminLogin", login_admin);
router.post("/updateAdminPermission", checkAdminToken, updatePermission);
router.post("/updateAdminNotification", checkAdminToken, updateNotification);
router.post("/updateAdminBasicDetails", checkAdminToken, upload.single('profilePic'), updateBasicDetails);
router.post("/adminDetail", checkAdminToken, getAdminDetail);
router.get("/adminList", checkAdminToken, getAdminList);
router.post("/deleteAdmin", checkAdminToken, deactiveAdmin);

//
router.post("/createFromGroup",checkAdminToken, createFromGroup);
router.post("/updateFromGroup",checkAdminToken, updateFromGroup);
router.post("/createFromField",checkAdminToken, form_field)
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
