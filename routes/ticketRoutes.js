const express = require("express");
const router = express.Router();

const Train = require("../models/Train");
const Ticket = require("../models/Ticket");
const User = require("../models/User");

// BOOK TICKET
router.post("/book", async (req, res) => {
  try {
    const { user_id, train_id } = req.body;
    const train = await Train.findById(train_id);
    if (!train) return res.status(404).json({ error: "Train not found" });

    const availableSeat = train.seats.find(s => s.status === "available" || s.status === "open");
    let ticket;
    if (availableSeat) {
      availableSeat.status = "booked";
      ticket = new Ticket({ user_id, train_id, seat_number: availableSeat.seat_number, status: "confirmed" });
    } else {
      ticket = new Ticket({ user_id, train_id, status: "waiting" });
    }
    await train.save();
    await ticket.save();
    res.json({ message: "Ticket booked", ticket });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET TICKETS BY USER
router.get("/user/:userId", async (req, res) => {
  try {
    const tickets = await Ticket.find({ user_id: req.params.userId });
    const enriched = await Promise.all(tickets.map(async ticket => {
      const train = await Train.findById(ticket.train_id);
      const user = await User.findById(ticket.user_id).select("-password");
      return {
        _id: ticket._id, user_id: ticket.user_id, train_id: ticket.train_id,
        seat_number: ticket.seat_number, status: ticket.status,
        user: user ? { name: user.name, email: user.email } : null,
        train: train ? { train_name: train.train_name, train_number: train.train_number, from_station: train.from_station, to_station: train.to_station, departure_time: train.departure_time, arrival_time: train.arrival_time, price_per_seat: train.price_per_seat } : null
      };
    }));
    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET ALL TICKETS (Admin)
router.get("/all", async (req, res) => {
  try {
    const tickets = await Ticket.find();
    const enriched = await Promise.all(tickets.map(async ticket => {
      const train = await Train.findById(ticket.train_id);
      const user = await User.findById(ticket.user_id).select("-password");
      return {
        _id: ticket._id, user_id: ticket.user_id, train_id: ticket.train_id,
        seat_number: ticket.seat_number, status: ticket.status,
        user: user ? { name: user.name, email: user.email } : null,
        train: train ? { train_name: train.train_name, train_number: train.train_number, from_station: train.from_station, to_station: train.to_station } : null
      };
    }));
    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET ALL TICKETS FOR A TRAIN (TTE)
router.get("/train/:trainId", async (req, res) => {
  try {
    const tickets = await Ticket.find({ train_id: req.params.trainId });
    const enriched = await Promise.all(tickets.map(async ticket => {
      const user = await User.findById(ticket.user_id).select("-password");
      return {
        _id: ticket._id, seat_number: ticket.seat_number, status: ticket.status,
        user: user ? { name: user.name, email: user.email } : null
      };
    }));
    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// MARK NOT BOARDED — notify next in waitlist
router.post("/not-boarded", async (req, res) => {
  try {
    const { train_id, seat_number } = req.body;
    const train = await Train.findById(train_id);
    if (!train) return res.status(404).json({ error: "Train not found" });
    const seat = train.seats.find(s => s.seat_number === seat_number);
    if (!seat) return res.status(404).json({ error: "Seat not found" });

    seat.status = "not_boarded";
    const waitingTicket = await Ticket.findOne({ train_id, status: "waiting" });
    if (waitingTicket) {
      waitingTicket.status = "notified";
      await waitingTicket.save();
      await train.save();
      return res.json({ message: "Waiting passenger notified for seat confirmation" });
    }
    await train.save();
    res.json({ message: "No waiting passengers — seat marked as not boarded" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// MARK SEAT VACANT (TTE direct action — frees seat, cancels ticket)
router.post("/mark-vacant", async (req, res) => {
  try {
    const { train_id, seat_number } = req.body;
    const train = await Train.findById(train_id);
    if (!train) return res.status(404).json({ error: "Train not found" });
    const seat = train.seats.find(s => s.seat_number === seat_number);
    if (!seat) return res.status(404).json({ error: "Seat not found" });

    const prevStatus = seat.status;
    seat.status = "available";

    // Cancel the ticket holding this seat (if any)
    const ticket = await Ticket.findOne({ train_id, seat_number, status: { $in: ["confirmed", "notified"] } });
    if (ticket) {
      ticket.status = "cancelled";
      await ticket.save();
    }

    // Notify next waiting passenger
    const waitingTicket = await Ticket.findOne({ train_id, status: "waiting" });
    if (waitingTicket) {
      waitingTicket.status = "notified";
      await waitingTicket.save();
    }

    await train.save();
    res.json({ message: `Seat #${seat_number} marked vacant${waitingTicket ? " — waiting passenger notified" : ""}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// MARK SEAT OCCUPIED (TTE manual override)
router.post("/mark-occupied", async (req, res) => {
  try {
    const { train_id, seat_number } = req.body;
    const train = await Train.findById(train_id);
    if (!train) return res.status(404).json({ error: "Train not found" });
    const seat = train.seats.find(s => s.seat_number === seat_number);
    if (!seat) return res.status(404).json({ error: "Seat not found" });

    seat.status = "booked";
    await train.save();
    res.json({ message: `Seat #${seat_number} marked occupied` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CONFIRM SEAT (notified passenger confirms)
router.post("/confirm-seat", async (req, res) => {
  try {
    const { user_id, train_id } = req.body;
    const ticket = await Ticket.findOne({ user_id, train_id, status: "notified" });
    if (!ticket) return res.status(404).json({ error: "No notified ticket found" });
    const train = await Train.findById(train_id);
    const seat = train.seats.find(s => s.status === "not_boarded");
    if (!seat) return res.status(400).json({ error: "No seat available" });

    seat.status = "booked";
    ticket.seat_number = seat.seat_number;
    ticket.status = "confirmed";
    await train.save();
    await ticket.save();
    res.json({ message: "Seat confirmed", ticket });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// OPEN SEAT FOR ALL
router.post("/open-seat", async (req, res) => {
  try {
    const { train_id, seat_number } = req.body;
    const train = await Train.findById(train_id);
    if (!train) return res.status(404).json({ error: "Train not found" });
    const seat = train.seats.find(s => s.seat_number === seat_number);
    if (!seat) return res.status(404).json({ error: "Seat not found" });
    seat.status = "open";
    await train.save();
    res.json({ message: "Seat is now open for all users" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
