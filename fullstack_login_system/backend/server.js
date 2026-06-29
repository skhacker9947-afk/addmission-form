require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path"); // Files ka rasta (path) set karne ke liye required hai
const { connectDB } = require("./config/db");
const authRoutes = require("./routes/authRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// 📂 Uploaded photos aur documents ko publically serve karne ke liye static route configuration
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// database connection
connectDB();

// routes
app.use("/api/auth", authRoutes);

// test route
app.get("/", (req, res) => {
    res.send("Backend is working");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
