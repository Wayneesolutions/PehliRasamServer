const express = require('express');
const router = express.Router();
const {validateProfile} = require('../../validations/userValidation');


const {
    createCustomer,
  submissionForm,
} = require('../../controllers/customer/customerController');

// // Public routes
// router.route('/register').post(createCustomer);
router.post('/register', validateProfile, createCustomer);

// router.route('/login').post(loginUser);


module.exports = router;
