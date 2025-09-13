"use client";

import React, { useEffect, useMemo, useState } from "react";
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

const days = ["Mon", "Tue", "Wed", "Thu", "Sat", "Sun"];

const AttendanceChart = () => {
  const [data, setData] = useState<any[]>([]);
  const maxCount = useMemo(() => {
    let m = 0;
    data.forEach((d) => {
      m = Math.max(m, Number(d.present || 0), Number(d.absent || 0));
    });
    return m;
  }, [data]);
  const ticks = useMemo(() => {
    const arr: number[] = [];
    for (let i = 0; i <= maxCount; i++) arr.push(i);
    return arr.length ? arr : [0];
  }, [maxCount]);

  useEffect(() => {
    const load = async () => {
      try {
        // Fetch attendance summary for the past 6 days (excluding Friday)
        const today = new Date();

        // Create base array for 6 days (Mon, Tue, Wed, Thu, Sat, Sun)
        const base: {
          name: string;
          present: number;
          absent: number;
          date: string;
        }[] = [];

        // Get the last 7 days and filter out Friday
        for (let i = 6; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(today.getDate() - i);
          const dayIndex = d.getDay();

          // Skip Friday (index 5)
          if (dayIndex === 5) continue;

          let dayName;
          if (dayIndex === 6) {
            // Saturday
            dayName = "Sat";
          } else if (dayIndex === 0) {
            // Sunday
            dayName = "Sun";
          } else {
            dayName = days[dayIndex - 1]; // Mon, Tue, Wed, Thu
          }

          base.push({
            name: dayName,
            present: 0,
            absent: 0,
            date: d.toISOString().slice(0, 10),
          });
        }

        // Get all classes and lessons to aggregate attendance data
        const [classesRes, lessonsRes] = await Promise.all([
          fetch("/api/classes?page=1&limit=1000"),
          fetch("/api/lessons?page=1&limit=1000"),
        ]);

        const [classesJson, lessonsJson] = await Promise.all([
          classesRes.json(),
          lessonsRes.json(),
        ]);

        const classes = classesJson.classes || classesJson || [];
        const lessons = lessonsJson.lessons || lessonsJson || [];

        // Iterate each day and aggregate attendance across all class-lesson combinations
        for (const dayData of base) {
          let dayPresent = 0;
          let dayAbsent = 0;

          // For each class-lesson combination, fetch attendance data
          for (const cls of classes) {
            for (const lesson of lessons) {
              // Check if this lesson is taught to this class
              const lessonClasses = lesson.classes || [];
              if (lessonClasses.some((lc: any) => lc.id === cls.id)) {
                try {
                  const res = await fetch(
                    `/api/attendance?classId=${cls.id}&lessonId=${lesson.id}&date=${dayData.date}`
                  );
                  if (res.ok) {
                    const json = await res.json();
                    const items = Array.isArray(json?.items) ? json.items : [];
                    items.forEach((it: any) => {
                      if (it.present) dayPresent += 1;
                      else dayAbsent += 1;
                    });
                  }
                } catch (e) {
                  // Skip failed requests
                  continue;
                }
              }
            }
          }

          // Update the day data
          dayData.present = dayPresent;
          dayData.absent = dayAbsent;
        }

        // Remove the date property before setting data
        const chartData = base.map(({ date, ...rest }) => rest);
        setData(chartData);
      } catch (e) {
        console.error("Attendance chart load error:", e);
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
          <YAxis allowDecimals={false} ticks={ticks} domain={[0, maxCount]} />
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
