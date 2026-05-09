const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const userRoutes = require("./routes/userRoutes");
const trainRoutes = require("./routes/trainRoutes");
const ticketRoutes = require("./routes/ticketRoutes");
const path = require("path");

// middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/users", userRoutes);
app.use("/api/trains", trainRoutes);
app.use("/api/tickets", ticketRoutes);

// Serve static files from the React app
app.use(express.static(path.join(__dirname, "frontend/dist")));

// For any other request, send back index.html
app.get(/.*/, (req, res) => {
  const indexPath = path.join(__dirname, "frontend/dist", "index.html");
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(200).send("Server is running 🚀 (Frontend not built yet)");
    }
  });
});

console.log("📁 Using local JSON storage...");

// start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// this is a comment 

