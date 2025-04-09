const express = require('express');
const router = express.Router();
const {validateProfile} = require('../../validations/userValidation');


const {
    createCustomer,
    SubmissionFormDetail,
} = require('../../controllers/customer/customerController');

// // Public routes
// router.route('/register').post(createCustomer);
router.post('/register', validateProfile, createCustomer);
router.post('/SubmissionFormDetail', SubmissionFormDetail);

// router.route('/login').post(loginUser);


module.exports = router;
