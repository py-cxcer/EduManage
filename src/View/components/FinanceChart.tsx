"use client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import { useEffect, useState } from "react";

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const FinanceChart = () => {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/finance?page=1&limit=1000");
        const json = await res.json();
        const list = Array.isArray(json?.payments) ? json.payments : json;
        const totals: Record<number, number> = {};
        (list || []).forEach((p: any) => {
          if (p.status === "PAID") {
            const d = new Date(p.paidAt || p.createdAt);
            const m = d.getMonth();
            totals[m] = (totals[m] || 0) + (p.amount || 0);
          }
        });
        const series = months.map((name, idx) => ({
          name,
          Fees: totals[idx] || 0,
        }));
        setData(series);
      } catch (e) {
        setData(months.map((m) => ({ name: m, Fees: 0 })));
      }
    };
    load();
  }, []);
  return (
    <div className="bg-white rounded-xl w-full h-full p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-semibold text-gray-400">Finance</h1>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          width={500}
          height={300}
          data={data}
          margin={{
            top: 10,
            right: 30,
            left: 20,
            bottom: 30,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#ddd" />
          <XAxis
            dataKey="name"
            axisLine={false}
            tick={{ fill: "#d1d5db" }}
            tickLine={false}
            tickMargin={10}
          />
          <YAxis
            axisLine={false}
            tick={{ fill: "#d1d5db" }}
            tickLine={false}
            tickMargin={10}
          />
          <Tooltip />
          <Legend
            align="center"
            verticalAlign="top"
            wrapperStyle={{ paddingTop: "10px", paddingBottom: "30px" }}
          />
          <Line
            type="monotone"
            dataKey="Fees"
            stroke="#A7C1A8"
            strokeWidth={3}
            legendType="circle"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default FinanceChart;
