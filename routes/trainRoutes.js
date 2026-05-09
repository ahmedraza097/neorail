const express = require("express");
const router = express.Router();
const Train = require("../models/Train");

router.post("/add", async (req, res) => {
  try {
    const { train_name, train_number, from_station, to_station, departure_time, arrival_time, total_seats } = req.body;
    const seats = [];
    for (let i = 1; i <= total_seats; i++) {
      seats.push({ seat_number: i, status: "available" });
    }
    const train = new Train({ train_name, train_number, from_station, to_station, departure_time, arrival_time, total_seats, seats });
    await train.save();
    res.json({ message: "Train added successfully", train });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { train_name, train_number, from_station, to_station, departure_time, arrival_time } = req.body;
    const train = await Train.findByIdAndUpdate(
      req.params.id,
      { train_name, train_number, from_station, to_station, departure_time, arrival_time },
      { new: true }
    );
    if (!train) return res.status(404).json({ error: "Train not found" });
    res.json({ message: "Train updated", train });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await Train.findByIdAndDelete(req.params.id);
    res.json({ message: "Train deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/search", async (req, res) => {
  try {
    const { from, to } = req.query;
    const query = {};
    if (from) query.from_station = { $regex: new RegExp(from, "i") };
    if (to) query.to_station = { $regex: new RegExp(to, "i") };
    const trains = await Train.find(query);
    res.json(trains);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const trains = await Train.find();
    res.json(trains);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const train = await Train.findById(req.params.id);
    if (!train) return res.status(404).json({ error: "Train not found" });
    res.json(train);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
