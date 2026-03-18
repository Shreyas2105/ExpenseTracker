const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config(); 

const app = express();

app.use(cors());
app.use(express.json());


app.use("/api/auth", require("./routes/auth")); // signup & login
app.use("/api/transactions", require("./routes/transactions")); // add/get transactions


app.get("/", (req, res) => {
  res.send("Expense Tracker API is running!");
});


const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
  });