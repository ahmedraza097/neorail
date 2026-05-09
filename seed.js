require("dotenv").config();

const Train = require("./models/Train");
const User = require("./models/User");

const sampleTrains = [
  { train_name: "Rajdhani Express",    train_number: "12301", from_station: "Mumbai Central", to_station: "New Delhi",       departure_time: "16:35", arrival_time: "08:35", total_seats: 20, price_per_seat: 1200 },
  { train_name: "Shatabdi Express",    train_number: "12002", from_station: "New Delhi",       to_station: "Bhopal",          departure_time: "06:00", arrival_time: "14:00", total_seats: 18, price_per_seat: 850  },
  { train_name: "Duronto Express",     train_number: "12213", from_station: "Kolkata",         to_station: "Mumbai Central",  departure_time: "20:15", arrival_time: "11:45", total_seats: 24, price_per_seat: 1500 },
  { train_name: "Vande Bharat Express",train_number: "22435", from_station: "Chennai Central", to_station: "Bengaluru",       departure_time: "06:00", arrival_time: "10:30", total_seats: 16, price_per_seat: 650  },
  { train_name: "Garib Rath Express",  train_number: "12216", from_station: "Bengaluru",       to_station: "Hyderabad",       departure_time: "22:30", arrival_time: "06:00", total_seats: 30, price_per_seat: 400  }
];

const defaultUsers = [
  { name: "admin", email: "admin", password: "1234",    role: "admin" },
  { name: "tte",   email: "tte",   password: "tte123",  role: "tte"   },
  { name: "Admin", email: "admin@neorail.io", password: "admin123", role: "admin" },
  { name: "TTE Officer", email: "tte@neorail.io", password: "tte123", role: "tte" }
];

async function seed() {
  try {
    console.log("Seeding to local JSON storage...");

    const existingCount = await Train.countDocuments();
    if (existingCount === 0) {
      for (const t of sampleTrains) {
        const seats = Array.from({ length: t.total_seats }, (_, i) => {
          const seatNum = i + 1;
          let berth = "Lower";
          if (seatNum % 3 === 2) berth = "Middle";
          if (seatNum % 3 === 0) berth = "Upper";
          return { seat_number: seatNum, status: "available", berth_type: berth };
        });
        await Train.create({ ...t, seats });
        console.log(`Added train: ${t.train_name}`);
      }
    } else {
      // Patch missing price_per_seat on existing trains
      for (const t of sampleTrains) {
        await Train.updateOne(
          { train_number: t.train_number, price_per_seat: { $exists: false } },
          { $set: { price_per_seat: t.price_per_seat } }
        );
      }
      console.log(`Trains already seeded (${existingCount}) — prices patched if missing.`);
    }

    for (const u of defaultUsers) {
      const exists = await User.findOne({ $or: [{ email: u.email }, { name: u.name, role: u.role }] });
      if (!exists) {
        await User.create(u);
        console.log(`Created ${u.role} account: ${u.email}`);
      } else {
        await User.updateOne({ _id: exists._id }, { $set: { role: u.role, password: u.password } });
      }
    }

    console.log("Seeding complete!");
    process.exit(0);
  } catch (err) {
    console.error("Seed error:", err.message);
    process.exit(1);
  }
}

seed();
