import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import "../styles/dashboard.css";

export default function Dashboard() {
  const [totalServices, setTotalServices] = useState(0);
  const [availableServices, setAvailableServices] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [netIncome, setNetIncome] = useState(0);

  const [transactions, setTransactions] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [range, setRange] = useState("daily"); // daily, weekly, monthly
  const [filteredIncome, setFilteredIncome] = useState(0);

  const servicesCollection = collection(db, "services");
  const transactionsCollection = collection(db, "transactions");
  const expensesCollection = collection(db, "expenses");

  const fetchData = async () => {
    // -------------------
    // SERVICES
    // -------------------
    const servicesData = await getDocs(servicesCollection);
    const servicesList = servicesData.docs.map(doc => doc.data());
    setTotalServices(servicesList.length);
    setAvailableServices(servicesList.filter(s => s.available).length);

    // -------------------
    // TRANSACTIONS (REVENUE)
    // -------------------
    const txData = await getDocs(transactionsCollection);
    const txList = txData.docs.map(doc => doc.data());
    setTransactions(txList);

    const revenue = txList.reduce(
      (sum, tx) => sum + Number(tx.price || 0),
      0
    );
    setTotalRevenue(revenue);

    // -------------------
    // EXPENSES
    // -------------------
    const expensesData = await getDocs(expensesCollection);
    const expensesList = expensesData.docs.map(doc => doc.data());

    const expensesTotal = expensesList.reduce(
      (sum, exp) => sum + Number(exp.amount || 0),
      0
    );

    setTotalExpenses(expensesTotal);

    // -------------------
    // NET INCOME
    // -------------------
    setNetIncome(revenue - expensesTotal);
  };

  // -----------------------------------------
  // FILTERING FUNCTIONS (Daily / Weekly / Monthly)
  // -----------------------------------------
  const groupByDay = (txList) => {
    const map = {};
    txList.forEach(tx => {
      const date = tx.finishedAt
        ? tx.finishedAt.toDate().toLocaleDateString()
        : new Date().toLocaleDateString();
      map[date] = (map[date] || 0) + Number(tx.price);
    });

    return Object.entries(map).map(([date, total]) => ({ label: date, revenue: total }));
  };

  const groupByWeek = (txList) => {
    const map = {};

    txList.forEach(tx => {
      const date = tx.finishedAt ? tx.finishedAt.toDate() : new Date();
      const oneJan = new Date(date.getFullYear(), 0, 1);
      const weekNumber = Math.ceil(((date - oneJan) / 86400000 + oneJan.getDay() + 1) / 7);

      const label = `Week ${weekNumber}`;
      map[label] = (map[label] || 0) + Number(tx.price);
    });

    return Object.entries(map).map(([week, total]) => ({ label: week, revenue: total }));
  };

  const groupByMonth = (txList) => {
    const map = {};

    txList.forEach(tx => {
      const date = tx.finishedAt ? tx.finishedAt.toDate() : new Date();
      const label = date.toLocaleString("default", { month: "long", year: "numeric" });
      map[label] = (map[label] || 0) + Number(tx.price);
    });

    return Object.entries(map).map(([month, total]) => ({ label: month, revenue: total }));
  };

  // -----------------------------------------
  // Update chart when range changes
  // -----------------------------------------
  useEffect(() => {
    if (transactions.length === 0) return;

    let data = [];

    if (range === "daily") data = groupByDay(transactions);
    if (range === "weekly") data = groupByWeek(transactions);
    if (range === "monthly") data = groupByMonth(transactions);

    setChartData(data);

    const total = data.reduce((sum, d) => sum + d.revenue, 0);
    setFilteredIncome(total);

  }, [range, transactions]);

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="dashboard-container">
      <h1>Dashboard</h1>

      <div className="stats-grid">

        <div className="stat-card">
          <h2>Total Services</h2>
          <p className="stat-number">{totalServices}</p>
        </div>

        <div className="stat-card available">
          <h2>Available Services</h2>
          <p className="stat-number">{availableServices}</p>
        </div>

        <div className="stat-card revenue">
          <h2>Total Revenue</h2>
          <p className="stat-number">₱{totalRevenue.toLocaleString()}</p>
        </div>

        <div className="stat-card expenses">
          <h2>Total Expenses</h2>
          <p className="stat-number">₱{totalExpenses.toLocaleString()}</p>
        </div>

        <div className="stat-card net">
          <h2>Net Income</h2>
          <p className="stat-number">₱{netIncome.toLocaleString()}</p>
        </div>

      </div>

      {/* ------------------------------ */}
      {/*   Income Filter Selector       */}
      {/* ------------------------------ */}
      <div className="income-filter">
        <h2>Income Summary</h2>

        <select
          className="income-select"
          value={range}
          onChange={(e) => setRange(e.target.value)}
        >
          <option value="daily">Daily Income</option>
          <option value="weekly">Weekly Income</option>
          <option value="monthly">Monthly Income</option>
        </select>

        <p className="filtered-income-value">
          Total {range.charAt(0).toUpperCase() + range.slice(1)} Income:
          <strong> ₱{filteredIncome.toLocaleString()}</strong>
        </p>
      </div>

      {/* ------------------------------ */}
      {/* Revenue Chart */}
      {/* ------------------------------ */}
      <div className="revenue-chart-container">
        <h2>{range.charAt(0).toUpperCase() + range.slice(1)} Revenue</h2>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#003d7a"
              strokeWidth={3}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
