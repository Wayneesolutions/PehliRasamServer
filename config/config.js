module.exports = {
  PORT: 8080,
  DB_CLUSTER: process.env.DB,
  DB_LOCAL: process.env.DB1,
  USE_DB: process.env.NODE_ENV || "development",
};
