const express = require("express");
const router = express.Router();
const Transaction = require("../models/Transaction");
const authMiddleware = require("../middleware/auth");


router.post("/", authMiddleware, async (req, res) => {
  const { type, category, amount, description, date } = req.body;

  try {
    const transaction = new Transaction({
      userId: req.userId, 
      type,
      category,
      amount,
      description,
      date: date || Date.now(),
    });

    await transaction.save();
    res.status(201).json(transaction);
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

router.get("/", authMiddleware, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.userId }).sort({
      date: -1,
    });

    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

router.get("/summary", authMiddleware, async (req, res) => {
  const { month, year } = req.query;

  const start = new Date(year, month - 1, 1);  
  const end = new Date(year, month, 0);         
  end.setHours(23, 59, 59, 999);               

  try {
    const transactions = await Transaction.find({
      userId: req.userId,
      date: { $gte: start, $lte: end }, 
    });

    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach((t) => {
      if (t.type === "income") totalIncome += t.amount;
      else totalExpense += t.amount;
    });

    res.json({
      month,
      year,
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      transactions, 
    });
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});


router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found." });
    }

    if (transaction.userId.toString() !== req.userId) {
      return res.status(403).json({ message: "Not authorized." });
    }

    await transaction.deleteOne();
    res.json({ message: "Transaction deleted." });
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

module.exports = router;