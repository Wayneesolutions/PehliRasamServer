require("dotenv").config({ path: "./.env" });

const app = require("./app");
const connectDB = require("./config/mongoConfig");

// connecting 
connectDB();



// a simple route to check if the server is running
app.get("/", (req, res) => {
  res.send("server is working fine!");
});

app.listen(process.env.PORT, () => {
  console.clear();
  console.log(`http://localhost:${process.env.PORT} ✅`);
});
