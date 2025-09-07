"use client";

import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const AttendanceChart = () => {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        // Fetch today's attendance summary across lessons/classes
        const today = new Date();
        const start = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate()
        );
        const end = new Date(start);
        end.setDate(start.getDate() + 7);

        const base = Array.from({ length: 7 }).map((_, i) => ({
          name: days[(start.getDay() + i) % 7],
          present: 0,
          absent: 0,
        }));

        // Iterate each day and query a lightweight summary endpoint (reuse attendance GET per date)
        for (let i = 0; i < 7; i++) {
          const d = new Date(start);
          d.setDate(start.getDate() + i);
          const iso = d.toISOString().slice(0, 10);
          const res = await fetch(
            `/api/attendance?classId=1&lessonId=1&date=${iso}`
          );
          if (!res.ok) continue;
          const json = await res.json();
          // Approximate: treat array entries as present booleans if available; else keep zeros
          const items = Array.isArray(json?.items) ? json.items : [];
          let present = 0;
          let absent = 0;
          items.forEach((it: any) => {
            if (it.present) present += 1;
            else absent += 1;
          });
          base[i].present = present;
          base[i].absent = absent;
        }

        setData(base);
      } catch (e) {
        // safe fallback
        setData([]);
      }
    };
    load();
  }, []);

  return (
    <div className="bg-white rounded-lg p-4 h-full">
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-semibold text-gray-400">Attendance</h1>
      </div>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart width={500} height={300} data={data} barSize={20}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ddd" />
          <XAxis
            dataKey="name"
            axisLine={false}
            tick={{ fill: "#d1d5db" }}
            tickLine={false}
          />
          <YAxis />
          <Tooltip
            contentStyle={{
              borderRadius: "10px",
              borderColor: "light-gray-200",
            }}
          />
          <Legend
            align="left"
            verticalAlign="top"
            wrapperStyle={{ paddingTop: "20px", paddingBottom: "40px" }}
          />
          <Bar
            dataKey="present"
            fill="#A7C1A8"
            legendType="circle"
            radius={[8, 8, 0, 0]}
          />
          <Bar
            dataKey="absent"
            fill="#819A91"
            legendType="circle"
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AttendanceChart;
