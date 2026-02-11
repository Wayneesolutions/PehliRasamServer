const path = require('path');
require("dotenv").config({ path: path.resolve(__dirname, '.env') });

const app = require("./app");
const connectDB = require("./config/mongoConfig");
const cron = require("node-cron");
const { sendBirthdayReminders } = require("./controllers/admin/birthdayController");
const { sendMembershipReminders } = require("./controllers/admin/membershipReminderController");
const { processIncomingEmails } = require("./utils/emailReceiver");

// connecting 
connectDB();

cron.schedule("0 9 * * *", async () => {
  console.log("🎂 Running scheduled birthday reminder check...");
  try {
    await sendBirthdayReminders();
  } catch (error) {
    console.error("❌ Error in scheduled birthday reminder:", error);
  }
}, {
  scheduled: true,
  timezone: "Asia/Kolkata"
});

console.log("✅ Birthday reminder cron job scheduled (Daily at 9:00 AM IST)");

// Schedule membership renewal reminders to run daily at 10:00 AM
cron.schedule("0 10 * * *", async () => {
  console.log("📧 Running scheduled membership renewal reminder check...");
  try {
    await sendMembershipReminders();
  } catch (error) {
    console.error("❌ Error in scheduled membership reminder:", error);
  }
}, {
  scheduled: true,
  timezone: "Asia/Kolkata"
});

console.log("✅ Membership renewal reminder cron job scheduled (Daily at 10:00 AM IST)");

// Schedule email inbox tracking to run every 1 minute
cron.schedule("*/1 * * * *", async () => {
  console.log("📧 Running scheduled email inbox tracking...");
  try {
    await processIncomingEmails();
  } catch (error) {
    console.error("❌ Error in scheduled email inbox tracking:", error);
  }
}, {
  scheduled: true,
  timezone: "Asia/Kolkata"
});

console.log("✅ Email inbox tracking cron job scheduled (Every 1 minute)");

// a simple route to check if the server is running
app.get("/", (req, res) => {
  res.send("server is working fine!");
});

app.listen(process.env.PORT, () => {
  console.clear();
  console.log(`http://localhost:${process.env.PORT} ✅`);
});
