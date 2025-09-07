"use client";
import {
  Pie,
  PieChart,
  ResponsiveContainer,
  Sector,
  SectorProps,
} from "recharts";

type Coordinate = {
  x: number;
  y: number;
};

type PieSectorData = {
  percent?: number;
  name?: string | number;
  midAngle?: number;
  middleRadius?: number;
  tooltipPosition?: Coordinate;
  value?: number;
  paddingAngle?: number;
  dataKey?: string;
  payload?: any;
};

type PieSectorDataItem = React.SVGProps<SVGPathElement> &
  Partial<SectorProps> &
  PieSectorData;

import { useEffect, useState } from "react";

const renderActiveShape = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  startAngle,
  endAngle,
  fill,
  payload,
  percent,
  value,
}: PieSectorDataItem) => {
  const RADIAN = Math.PI / 180;
  const sin = Math.sin(-RADIAN * (midAngle ?? 1));
  const cos = Math.cos(-RADIAN * (midAngle ?? 1));
  const sx = (cx ?? 0) + ((outerRadius ?? 0) + 10) * cos;
  const sy = (cy ?? 0) + ((outerRadius ?? 0) + 10) * sin;
  const mx = (cx ?? 0) + ((outerRadius ?? 0) + 30) * cos;
  const my = (cy ?? 0) + ((outerRadius ?? 0) + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? "start" : "end";

  return (
    <g>
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill}>
        {payload.name}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={(outerRadius ?? 0) + 6}
        outerRadius={(outerRadius ?? 0) + 10}
        fill={fill}
      />
      <path
        d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`}
        stroke={fill}
        fill="none"
      />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text
        x={ex + (cos >= 0 ? 1 : -1) * 12}
        y={ey}
        textAnchor={textAnchor}
        fill="#333"
      >{`PV ${value}`}</text>
      <text
        x={ex + (cos >= 0 ? 1 : -1) * 12}
        y={ey}
        dy={18}
        textAnchor={textAnchor}
        fill="#999"
      >
        {`(Rate ${((percent ?? 1) * 100).toFixed(2)}%)`}
      </text>
    </g>
  );
};

const CountChart = () => {
  const [chartData, setChartData] = useState([
    { name: "Boys", value: 0, fill: "#819A91" },
    { name: "Girls", value: 0, fill: "#A7C1A8" },
  ]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/students?page=1&limit=1000");
        const json = await res.json();
        const list = Array.isArray(json?.students) ? json.students : json;
        let boys = 0;
        let girls = 0;
        (list || []).forEach((s: any) => {
          const sex = String(s.sex || "").toUpperCase();
          if (sex === "MALE") boys += 1;
          else if (sex === "FEMALE") girls += 1;
        });
        setChartData([
          { name: "Boys", value: boys, fill: "#819A91" },
          { name: "Girls", value: girls, fill: "#A7C1A8" },
        ]);
      } catch (e) {
        // keep defaults
      }
    };
    load();
  }, []);
  return (
    <div className="bg-white rounded-xl w-full h-full p-4">
      {/* TITLE */}
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-semibold text-gray-400">Students</h1>
      </div>
      {/* CHART */}
      <div className="h-64 flex items-center justify-center">
        <div className="w-48 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                dataKey="value"
                stroke="none"
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      {/* BOTTOM */}
      <div className="flex justify-center gap-16">
        {(() => {
          const boys = chartData[0].value;
          const girls = chartData[1].value;
          const total = (boys || 0) + (girls || 0);
          const boysPct = total > 0 ? Math.round((boys / total) * 100) : 0;
          const girlsPct = total > 0 ? Math.round((girls / total) * 100) : 0;
          return (
            <>
              <div className="flex flex-col gap-1">
                <div className="w-5 h-5 bg-[#819A91] rounded-full"></div>
                <h1 className="font-bold text-gray-500">{boys}</h1>
                <h2 className="text-xs font-semibold text-gray-700">
                  Boys ({boysPct}%)
                </h2>
              </div>
              <div className="flex flex-col gap-1">
                <div className="w-5 h-5 bg-[#A7C1A8] rounded-full"></div>
                <h1 className="font-bold text-gray-500">{girls}</h1>
                <h2 className="text-xs font-semibold text-gray-700">
                  Girls ({girlsPct}%)
                </h2>
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
};

export default CountChart;
