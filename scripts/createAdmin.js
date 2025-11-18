#!/usr/bin/env node

/**
 * CLI Script to Create a New Admin
 * 
 * Usage:
 *   node scripts/createAdmin.js --firstName "John" --lastName "Doe" --email "john@example.com" --password "securepass123" [--role "super_admin"]
 * 
 * Or with npm script:
 *   npm run create-admin -- --firstName "John" --lastName "Doe" --email "john@example.com" --password "securepass123"
 */

const path = require('path');
require("dotenv").config({ path: path.resolve(__dirname, '../.env') });

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Admin = require("../models/admin/adminModel");
const connectDB = require("../config/mongoConfig");

// Parse command line arguments
function parseArgs() {
    const args = process.argv.slice(2);
    const parsed = {};
    
    for (let i = 0; i < args.length; i += 2) {
        const key = args[i]?.replace(/^--/, '');
        const value = args[i + 1];
        if (key && value) {
            parsed[key] = value;
        }
    }
    
    return parsed;
}

// Validate required fields
function validateInput(input) {
    const errors = [];
    
    if (!input.firstName) errors.push('--firstName is required');
    if (!input.lastName) errors.push('--lastName is required');
    if (!input.email) errors.push('--email is required');
    if (!input.password) errors.push('--password is required');
    
    // Validate email format
    if (input.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
        errors.push('Invalid email format');
    }
    
    // Validate password length
    if (input.password && input.password.length < 6) {
        errors.push('Password must be at least 6 characters long');
    }
    
    // Validate role if provided
    if (input.role && !['admin', 'super_admin'].includes(input.role)) {
        errors.push('Role must be either "admin" or "super_admin"');
    }
    
    return errors;
}

// Main function
async function createAdmin() {
    try {
        // Parse arguments
        const args = parseArgs();
        
        // Show help if no arguments or --help flag
        if (args.length === 0 || args.help) {
            console.log(`
Usage: node scripts/createAdmin.js [options]

Options:
  --firstName <name>     Admin first name (required)
  --lastName <name>      Admin last name (required)
  --email <email>        Admin email address (required)
  --password <password>  Admin password (required, min 6 characters)
  --role <role>          Admin role: "admin" or "super_admin" (default: "admin")
  --number <number>      Admin phone number (optional)
  --help                 Show this help message

Examples:
  node scripts/createAdmin.js --firstName "John" --lastName "Doe" --email "john@example.com" --password "securepass123"
  
  node scripts/createAdmin.js --firstName "Jane" --lastName "Smith" --email "jane@example.com" --password "securepass123" --role "super_admin"
            `);
            process.exit(0);
        }
        
        // Validate input
        const errors = validateInput(args);
        if (errors.length > 0) {
            console.error('❌ Validation errors:');
            errors.forEach(error => console.error(`   - ${error}`));
            process.exit(1);
        }
        
        // Connect to database
        console.log('📡 Connecting to database...');
        await connectDB();
        
        // Check if admin with this email already exists
        const existingAdmin = await Admin.findOne({ email: args.email.toLowerCase().trim() });
        if (existingAdmin) {
            console.error(`❌ Admin with email "${args.email}" already exists!`);
            await mongoose.connection.close();
            process.exit(1);
        }
        
        // Hash password
        console.log('🔐 Hashing password...');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(args.password, salt);
        
        // Create admin object
        const adminData = {
            firstName: args.firstName.trim(),
            lastName: args.lastName.trim(),
            email: args.email.toLowerCase().trim(),
            password: hashedPassword,
            role: args.role || 'admin',
        };
        
        // Add optional fields
        if (args.number) {
            adminData.number = parseInt(args.number);
        }
        
        // Create admin
        console.log('👤 Creating admin...');
        const admin = new Admin(adminData);
        await admin.save();
        
        // Success message
        console.log('\n✅ Admin created successfully!');
        console.log('\n📋 Admin Details:');
        console.log(`   ID: ${admin._id}`);
        console.log(`   Name: ${admin.firstName} ${admin.lastName}`);
        console.log(`   Email: ${admin.email}`);
        console.log(`   Role: ${admin.role}`);
        if (admin.number) {
            console.log(`   Phone: ${admin.number}`);
        }
        console.log(`   Status: ${admin.status}`);
        console.log(`   Created: ${admin.createdAt}`);
        console.log('\n💡 You can now login with this email and password.\n');
        
        // Close database connection
        await mongoose.connection.close();
        process.exit(0);
        
    } catch (error) {
        console.error('\n❌ Error creating admin:');
        console.error(`   ${error.message}`);
        
        if (error.code === 11000) {
            console.error('\n   This email already exists in the database.');
        }
        
        // Close database connection on error
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
        }
        
        process.exit(1);
    }
}

// Run the script
createAdmin();

