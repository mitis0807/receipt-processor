const express = require("express");
const { v4: uuidv4 } = require("uuid");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// In-memory storage
const receipts = {};
const points = {};

// Process receipt
app.post("/receipts/process", (req, res) => {
  const { retailer, purchaseDate, purchaseTime, items, total } = req.body;

  // Validate request
  if (!retailer || !purchaseDate || !purchaseTime || !items || !total) {
    return res.status(400).json({ error: "Invalid receipt format." });
  }

  const receiptId = uuidv4();
  receipts[receiptId] = { retailer, purchaseDate, purchaseTime, items, total };
  points[receiptId] = calculatePoints(items); // Assign points based on receipt data

  res.json({ id: receiptId, points: points[receiptId] });
});

// Get points for a receipt
app.get("/receipts/:id/points", (req, res) => {
  const { id } = req.params;

  if (points[id] !== undefined) {
    return res.json({ points: points[id] });
  }

  res.status(404).json({ error: "No receipt found for that ID." });
});

// Function to calculate points (Basic Example)
function calculatePoints(items) {
  return items.length * 10; // Assign 10 points per item
}

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
