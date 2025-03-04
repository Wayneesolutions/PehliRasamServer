const Customer = require('../../models/customer/customerModel');
const ErrorHandler = require('../../utils/errorHandler');
const catchAsyncErrors = require('../../middleware/catchAsyncErrors');
const crypto = require('crypto');
const sendToken = require('../../utils/jwtToken');
const validateRequest = require('../../middleware/validateRequest');

