const Joi = require('joi');

const userValidation = {
  // Registration validation
  registerSchema: Joi.object({
    name: Joi.string().min(2).max(50).required()
      .messages({
        'string.empty': 'Name is required',
        'string.min': 'Name should have at least 2 characters',
        'string.max': 'Name cannot exceed 50 characters'
      }),
    email: Joi.string().email().required()
      .messages({
        'string.email': 'Please enter valid email',
        'string.empty': 'Email is required'
      }),
    password: Joi.string().min(6).required()
      .messages({
        'string.empty': 'Password is required',
        'string.min': 'Password should be at least 6 characters long'
      })
  }),

  // Login validation
  loginSchema: Joi.object({
    email: Joi.string().email().required()
      .messages({
        'string.email': 'Please enter valid email',
        'string.empty': 'Email is required'
      }),
    password: Joi.string().required()
      .messages({
        'string.empty': 'Password is required'
      })
  }),

  // Forgot password validation
  forgotPasswordSchema: Joi.object({
    email: Joi.string().email().required()
      .messages({
        'string.email': 'Please enter valid email',
        'string.empty': 'Email is required'
      })
  }),

  // Reset password validation
  resetPasswordSchema: Joi.object({
    password: Joi.string().min(6).required()
      .messages({
        'string.empty': 'Password is required',
        'string.min': 'Password should be at least 6 characters long'
      }),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required()
      .messages({
        'any.only': 'Passwords do not match'
      })
  }),

  // Update password validation
  updatePasswordSchema: Joi.object({
    oldPassword: Joi.string().required()
      .messages({
        'string.empty': 'Old password is required'
      }),
    password: Joi.string().min(6).required()
      .messages({
        'string.empty': 'New password is required',
        'string.min': 'Password should be at least 6 characters long'
      })
  }),

  // Update profile validation
  updateProfileSchema: Joi.object({
    name: Joi.string().min(2).max(50).required()
      .messages({
        'string.empty': 'Name is required',
        'string.min': 'Name should have at least 2 characters',
        'string.max': 'Name cannot exceed 50 characters'
      }),
    email: Joi.string().email().required()
      .messages({
        'string.email': 'Please enter valid email',
        'string.empty': 'Email is required'
      })
  }),

  // Admin update user validation
  adminUpdateUserSchema: Joi.object({
    name: Joi.string().min(2).max(50).required()
      .messages({
        'string.empty': 'Name is required',
        'string.min': 'Name should have at least 2 characters',
        'string.max': 'Name cannot exceed 50 characters'
      }),
    email: Joi.string().email().required()
      .messages({
        'string.email': 'Please enter valid email',
        'string.empty': 'Email is required'
      }),
    role: Joi.string().valid('user', 'admin').required()
      .messages({
        'any.only': 'Role must be either user or admin'
      })
  })
};

module.exports = userValidation; 