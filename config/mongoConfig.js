const mongoose = require("mongoose");
const config = require("./config");

const connectDB = async () => {
  const dbUrl =
    config.USE_DB === "production" ? config.DB_CLUSTER : config.DB_LOCAL;

  await mongoose
    .connect(`${dbUrl}`)
    .then((data) => console.log(`mongoDB connected to ${config.USE_DB} ✅`))
    .catch((err) => console.log("DB Connection ERROR ::", err.message));
};

module.exports = connectDB;
