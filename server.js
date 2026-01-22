const path = require('path');
require("dotenv").config({ path: path.resolve(__dirname, '.env') });

const app = require("./app");
const connectDB = require("./config/mongoConfig");
const cron = require("node-cron");
const { sendBirthdayReminders } = require("./controllers/admin/birthdayController");

// connecting 
connectDB();

// Schedule birthday reminder emails to run daily at 9:00 AM
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

// a simple route to check if the server is running
app.get("/", (req, res) => {
  res.send("server is working fine!");
});

app.listen(process.env.PORT, () => {
  console.clear();
  console.log(`http://localhost:${process.env.PORT} ✅`);
});
