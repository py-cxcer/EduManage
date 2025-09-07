"use client";

import ProtectedRoute from "../../../View/components/ProtectedRoute";
import UserCard from "@/View/components/UserCard";
import CountChart from "@/View/components/CountChart";
import AttendanceChart from "@/View/components/AttendanceChart";
import FinanceChart from "@/View/components/FinanceChart";
import CalendarComponent from "@/View/components/CalendarComponent";
import Announcement from "@/View/components/Announcement";

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute requiredRole="ADMIN">
      <div className="p-4 flex gap-4 flex-col md:flex-row">
        {/*Left*/}
        <div className="w-full lg:w-2/3 flex flex-col gap-8">
          {/*USER CARD*/}
          <div className="flex gap-4 justify-between">
            <UserCard type="student" />
            <UserCard type="teacher" />
            <UserCard type="parent" />
          </div>
          {/* MIDDLE CHARTS */}
          <div className="flex gap-4 flex-col lg:flex-row">
            {/* COUNT CHART */}
            <div className="w-full lg:w-1/3 h-[450px] bg-gray-50 rounded-xl p-4">
              <CountChart />
            </div>
            {/* ATTENDANCE CHART */}
            <div className="w-full lg:w-2/3 h-[450px] bg-gray-50 rounded-xl p-4">
              <AttendanceChart />
            </div>
          </div>
          {/* BOTTOM CHARTS */}
          <div className="w-full h-[500px]">
            <FinanceChart />
          </div>
        </div>
        {/* RIGHT */}
        <div className="w-full lg:w-1/3 flex flex-col gap-8">
          <CalendarComponent />
          <Announcement />
        </div>
      </div>
    </ProtectedRoute>
  );
}
