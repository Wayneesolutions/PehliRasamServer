#!/usr/bin/env node

/**
 * Script to check if an admin exists and verify credentials
 * Usage: node scripts/checkAdmin.js --email "admin@gmail.com"
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
    
    // Handle both --key value and key=value formats
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        
        // Handle --key=value format
        if (arg.includes('=')) {
            const [key, ...valueParts] = arg.split('=');
            const cleanKey = key.replace(/^--?/, '');
            parsed[cleanKey] = valueParts.join('=');
        }
        // Handle --key value format
        else if (arg.startsWith('--')) {
            const key = arg.replace(/^--/, '');
            const value = args[i + 1];
            if (value && !value.startsWith('--')) {
                parsed[key] = value;
                i++; // Skip next argument as it's the value
            }
        }
        // Handle positional arguments (for backward compatibility)
        else if (i === 0 && !parsed.email) {
            parsed.email = arg;
        } else if (i === 1 && !parsed.password) {
            parsed.password = arg;
        }
    }
    
    return parsed;
}

async function checkAdmin() {
    try {
        const args = parseArgs();
        
        // Debug: Show what arguments were parsed
        console.log('Parsed arguments:', args);
        
        // Handle email - check parsed args first, then positional arguments
        let email = args.email;
        let password = args.password;
        
        // If no named arguments, check positional arguments (npm passes them this way)
        if (!email && process.argv.length > 2) {
            // Check if first arg is email (doesn't start with --)
            const firstArg = process.argv[2];
            if (firstArg && !firstArg.startsWith('--') && firstArg.includes('@')) {
                email = firstArg;
            }
        }
        
        if (!password && process.argv.length > 3) {
            const secondArg = process.argv[3];
            if (secondArg && !secondArg.startsWith('--')) {
                password = secondArg;
            }
        }
        
        email = email?.toLowerCase().trim();
        
        if (!email) {
            console.log('\nUsage:');
            console.log('  npm run check-admin -- --email "admin@gmail.com"');
            console.log('  npm run check-admin -- --email "admin@gmail.com" --password "12345678"');
            console.log('\nOr directly:');
            console.log('  node scripts/checkAdmin.js --email "admin@gmail.com"');
            console.log('  node scripts/checkAdmin.js --email "admin@gmail.com" --password "12345678"');
            process.exit(1);
        }
        
        console.log('📡 Connecting to database...');
        await connectDB();
        
        console.log(`\n🔍 Checking admin with email: ${email}\n`);
        
        // Find admin (including deleted ones)
        const admin = await Admin.findOne({ email });
        
        if (!admin) {
            console.log('❌ Admin not found in database!');
            console.log('\n💡 You can create this admin using:');
            console.log(`   npm run create-admin -- --firstName "Admin" --lastName "User" --email "${email}" --password "12345678"`);
            await mongoose.connection.close();
            process.exit(1);
        }
        
        console.log('✅ Admin found!');
        console.log('\n📋 Admin Details:');
        console.log(`   ID: ${admin._id}`);
        console.log(`   Name: ${admin.firstName} ${admin.lastName}`);
        console.log(`   Email: ${admin.email}`);
        console.log(`   Role: ${admin.role}`);
        console.log(`   Status: ${admin.status || 'active'}`);
        console.log(`   Is Deleted: ${admin.isDeleted}`);
        console.log(`   Created: ${admin.createdAt}`);
        console.log(`   Last Login: ${admin.lastLogin || 'Never'}`);
        
        if (admin.isDeleted) {
            console.log('\n⚠️  WARNING: This admin is marked as deleted!');
            console.log('   Login will fail because isDeleted=true');
        }
        
        if (admin.status && admin.status !== 'active') {
            console.log(`\n⚠️  WARNING: Admin status is "${admin.status}"`);
            console.log('   Login may fail if status check is enforced');
        }
        
        // Test password if provided
        if (password) {
            console.log('\n🔐 Testing password...');
            const isMatch = await bcrypt.compare(password, admin.password);
            if (isMatch) {
                console.log('✅ Password is CORRECT!');
            } else {
                console.log('❌ Password is INCORRECT!');
                console.log('\n💡 The password in database does not match the provided password.');
            }
        } else {
            console.log('\n💡 To test password, run:');
            console.log(`   node scripts/checkAdmin.js --email "${email}" --password "your_password"`);
        }
        
        console.log('\n');
        await mongoose.connection.close();
        process.exit(0);
        
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
        }
        process.exit(1);
    }
}

checkAdmin();

