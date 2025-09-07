"use client";

import ProtectedRoute from "../../../View/components/ProtectedRoute";
import CalendarComponent from "@/View/components/CalendarComponent";
import Announcement from "@/View/components/Announcement";
import ScheduleCalendar from "@/View/components/ScheduleCalendar";

export default function StudentPage() {
  return (
    <ProtectedRoute requiredRole="STUDENT">
      <div className="p-4 flex gap-4 flex-col xl:flex-row">
        {/* LEFT */}
        <div className="w-full xl:w-2/3">
          <div className="h-full bg-white p-4 rounded-md">
            <h1 className="text-xl font-semibold text-gray-400">Schedule</h1>
            <ScheduleCalendar />
          </div>
        </div>
        {/* RIGHT */}
        <div className="w-full xl:w-1/3 flex flex-col gap-8">
          <CalendarComponent />
          <Announcement />
        </div>
      </div>
    </ProtectedRoute>
  );
}
