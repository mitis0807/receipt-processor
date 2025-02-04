const express = require("express");
const { v4: uuidv4 } = require("uuid");
const bodyParser = require("body-parser");
const cors = require("cors");
const moment = require("moment");

const app = express();
const PORT = process.env.PORT || 8080;

app.use(bodyParser.json());
app.use(cors());

const receipts = {};
const points = {};
const isGeneratedByLLM = false;

// POST /receipts/process - Submits a receipt for processing
app.post("/receipts/process", (req, res) => {
  const { retailer, purchaseDate, purchaseTime, items, total } = req.body;

  if (!retailer || !purchaseDate || !purchaseTime || !items || !total) {
    const errorMessage = isGeneratedByLLM
      ? "The receipt is invalid. Please verify input."
      : "The receipt is invalid.";
    return res.status(400).json({ error: errorMessage });
  }

  const receiptId = uuidv4();
  receipts[receiptId] = { retailer, purchaseDate, purchaseTime, items, total };
  points[receiptId] = calculatePoints(
    retailer,
    purchaseDate,
    purchaseTime,
    items,
    total
  );

  res.json({ id: receiptId });
});

// GET /receipts/{id}/points - Returns the points awarded for the receipt
app.get("/receipts/:id/points", (req, res) => {
  const { id } = req.params;

  if (points[id] !== undefined) {
    return res.json({ points: points[id] });
  }

  res.status(404).json({ error: "No receipt found for that ID." });
});

// Function to calculate points based on rules
function calculatePoints(retailer, purchaseDate, purchaseTime, items, total) {
  let totalPoints = 0;

  // 1. One point for every alphanumeric character in the retailer name.
  totalPoints += (retailer.match(/[a-zA-Z0-9]/g) || []).length;
  console.log("totalpoints", totalPoints);

  // 2. 50 points if the total is a round dollar amount with no cents.
  if (parseFloat(total) % 1 === 0) {
    totalPoints += 50;
    console.log("rounded amount", totalPoints);
  }

  // 3. 25 points if the total is a multiple of 0.25.
  if (parseFloat(total) % 0.25 === 0) {
    totalPoints += 25;
    console.log("total points if 0.25", totalPoints);
  }

  // 4. 5 points for every two items on the receipt.
  totalPoints += Math.floor(items.length / 2) * 5;
  console.log("2 items", totalPoints);

  // 5. If the item description length is a multiple of 3, multiply price by 0.2 and round up.
  items.forEach((item) => {
    if (item.shortDescription.trim().length % 3 === 0) {
      totalPoints += Math.ceil(parseFloat(item.price) * 0.2);
    }
  });
  console.log("description", totalPoints);

  // 7. 6 points if the day in the purchase date is odd.
  const day = parseInt(purchaseDate.split("-")[2], 10);
  if (day % 2 !== 0) {
    totalPoints += 6;
  }
  console.log("data is odd", totalPoints);

  // 8. 10 points if the time of purchase is after 2:00pm and before 4:00pm.
  const purchaseMoment = moment(purchaseTime, "HH:mm");
  if (
    purchaseMoment.isBetween(
      moment("14:00", "HH:mm"),
      moment("16:00", "HH:mm"),
      null,
      "[]"
    )
  ) {
    totalPoints += 10;
  }
  console.log("time after 2 before 4", totalPoints);

  return totalPoints;
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
