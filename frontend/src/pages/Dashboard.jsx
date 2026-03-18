import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getTransactions,
  addTransaction,
  deleteTransaction,
  getMonthlySummary,
} from "../api";

// Predefined categories so the user picks from a list
const CATEGORIES = {
  income: ["Salary", "Freelance", "Business", "Investment", "Gift", "Other"],
  expense: ["Food", "Rent", "Transport", "Shopping", "Health", "Entertainment", "Utilities", "Other"],
};

function Dashboard() {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();

  // --- State ---
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, balance: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Month/year picker for the summary
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1); // JS months are 0-indexed
  const [year, setYear] = useState(today.getFullYear());

  // Add transaction form state
  const [form, setForm] = useState({
    type: "expense",
    category: "Food",
    amount: "",
    description: "",
    date: today.toISOString().split("T")[0], // today's date in YYYY-MM-DD
  });
  const [formLoading, setFormLoading] = useState(false);

  // --- Load data from backend ---
  // useCallback so we can call this function from multiple places
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all transactions AND monthly summary at the same time
      const [txRes, summaryRes] = await Promise.all([
        getTransactions(),
        getMonthlySummary(month, year),
      ]);
      setTransactions(txRes.data);
      setSummary(summaryRes.data);
    } catch (err) {
      setError("Failed to load data. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  // Run fetchData when component mounts or month/year changes
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Handlers ---
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    // When type changes, reset category to first option for that type
    if (name === "type") {
      setForm({ ...form, type: value, category: CATEGORIES[value][0] });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await addTransaction({ ...form, amount: Number(form.amount) });
      // Reset form amount and description after adding
      setForm((f) => ({ ...f, amount: "", description: "" }));
      // Reload data to show the new transaction
      await fetchData();
    } catch (err) {
      setError("Failed to add transaction.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this transaction?")) return;
    try {
      await deleteTransaction(id);
      await fetchData();
    } catch (err) {
      setError("Failed to delete transaction.");
    }
  };

  const handleLogout = () => {
    logoutUser();
    navigate("/login");
  };

  // --- Helpers ---
  const formatAmount = (n) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

  const formatDate = (d) =>
    new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  return (
    <div className="dashboard">

      {/* ---- Navbar ---- */}
      <div className="navbar">
        <h1>💰 expense tracker</h1>
        <div style={{ display: "flex", alignItems: "center" }}>
          <span>Hi, {user?.name}</span>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {/* ---- Month picker ---- */}
      <div className="month-picker">
        <span style={{ fontSize: "0.875rem", color: "#888" }}>Showing:</span>
        <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
          {MONTHS.map((m, i) => (
            <option key={m} value={i + 1}>{m}</option>
          ))}
        </select>
        <input
          type="number"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          style={{ width: "90px" }}
        />
      </div>

      {/* ---- Summary cards ---- */}
      <div className="summary-cards">
        <div className="card income">
          <div className="label">Income</div>
          <div className="amount">{formatAmount(summary.totalIncome)}</div>
        </div>
        <div className="card expense">
          <div className="label">Expenses</div>
          <div className="amount">{formatAmount(summary.totalExpense)}</div>
        </div>
        <div className="card">
          <div className="label">Balance</div>
          <div
            className="amount"
            style={{ color: summary.balance >= 0 ? "var(--income)" : "var(--expense)" }}
          >
            {formatAmount(summary.balance)}
          </div>
        </div>
      </div>

      {/* ---- Add Transaction Form ---- */}
      <div className="add-form">
        <h3>Add Transaction</h3>
        <form onSubmit={handleAddTransaction}>
          <div className="form-row">
            <div className="form-group">
              <label>Type</label>
              <select name="type" value={form.type} onChange={handleFormChange}>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>
            <div className="form-group">
              <label>Category</label>
              <select name="category" value={form.category} onChange={handleFormChange}>
                {CATEGORIES[form.type].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Amount (₹)</label>
              <input
                type="number"
                name="amount"
                value={form.amount}
                onChange={handleFormChange}
                placeholder="0"
                min="1"
                required
              />
            </div>
            <div className="form-group">
              <label>Date</label>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleFormChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Description (optional)</label>
            <input
              type="text"
              name="description"
              value={form.description}
              onChange={handleFormChange}
              placeholder="e.g. Lunch at restaurant"
            />
          </div>

          <button className="btn btn-primary" type="submit" disabled={formLoading}>
            {formLoading ? "Adding..." : "Add Transaction"}
          </button>
        </form>
      </div>

      {/* ---- Transaction List ---- */}
      <div className="transactions-section">
        <h3>All Transactions</h3>

        {loading ? (
          <div className="empty">Loading...</div>
        ) : transactions.length === 0 ? (
          <div className="empty">No transactions yet. Add one above!</div>
        ) : (
          <div className="transaction-list">
            {transactions.map((t) => (
              <div className="transaction-item" key={t._id}>
                <div className="left">
                  <span className="category">{t.category}</span>
                  {t.description && <span className="description">{t.description}</span>}
                  <span className="date">{formatDate(t.date)}</span>
                </div>
                <div className="right">
                  <span className={`badge ${t.type}`}>
                    {t.type === "income" ? "+" : "-"}
                    {formatAmount(t.amount)}
                  </span>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDelete(t._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;