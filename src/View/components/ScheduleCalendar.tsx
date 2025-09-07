"use client";

import { Calendar, momentLocalizer, View, Views } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useState, useEffect } from "react";

const localizer = momentLocalizer(moment);

const ScheduleCalendar = () => {
  const [view, setView] = useState<View>(Views.WEEK);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Update current date every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  const handleOnChangeView = (selectedView: View) => {
    setView(selectedView);
  };

  return (
    <Calendar
      localizer={localizer}
      // events={myEventsList}
      startAccessor="start"
      endAccessor="end"
      views={[Views.WEEK, Views.DAY]}
      view={view}
      date={currentDate}
      onView={handleOnChangeView}
      style={{ height: "98%" }}
      min={new Date(2025, 1, 0, 8, 0, 0)}
      max={new Date(2025, 1, 0, 15, 0, 0)}
    />
  );
};

export default ScheduleCalendar;
