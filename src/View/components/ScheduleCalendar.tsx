"use client";

import {
  Calendar,
  momentLocalizer,
  View,
  Views,
  DateRange,
} from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useState, useEffect } from "react";

const localizer = momentLocalizer(moment);

type ScheduleEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  color?: string;
  type?: "lesson" | "assignment" | "exam";
};

const ScheduleCalendar = () => {
  const [view, setView] = useState<View>(Views.WEEK);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<ScheduleEvent[]>([]);

  // Update current date every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  const fetchRange = async (start: Date, end: Date) => {
    try {
      const qs = `start=${start.toISOString()}&end=${end.toISOString()}`;
      const res = await fetch(`/api/schedule?${qs}`);
      if (!res.ok) return;
      const data = await res.json();
      const mapped: ScheduleEvent[] = (data.events || []).map((e: any) => ({
        ...e,
        start: new Date(e.start),
        end: new Date(e.end),
      }));
      setEvents(mapped);
    } catch (e) {
      console.error("Failed to load schedule", e);
    }
  };

  const handleOnChangeView = (selectedView: View) => {
    setView(selectedView);
  };

  const onNavigate = (date: Date) => {
    setCurrentDate(date);
  };

  useEffect(() => {
    // compute range for current view/date
    const start = moment(currentDate)
      .startOf(view === Views.DAY ? "day" : "week")
      .toDate();
    const end = moment(currentDate)
      .endOf(view === Views.DAY ? "day" : "week")
      .toDate();
    fetchRange(start, end);
  }, [currentDate, view]);

  return (
    <Calendar
      localizer={localizer}
      events={events}
      startAccessor="start"
      endAccessor="end"
      views={[Views.WEEK, Views.DAY]}
      view={view}
      date={currentDate}
      onView={handleOnChangeView}
      onNavigate={onNavigate}
      style={{ height: "98%" }}
      min={new Date(2025, 1, 0, 8, 0, 0)}
      max={new Date(2025, 1, 0, 18, 0, 0)}
      eventPropGetter={(event) => {
        const bg = "#F1F8E8";
        return {
          style: {
            backgroundColor: bg,
            borderColor: bg,
            color: "#2f3e2f",
            padding: "4px 6px",
            lineHeight: 1.0,
            whiteSpace: "normal",
            wordBreak: "break-word",
          },
        } as any;
      }}
      components={{
        event: ({ title }: any) => (
          <div style={{ whiteSpace: "normal", wordBreak: "break-word" }}>
            {title}
          </div>
        ),
      }}
    />
  );
};

export default ScheduleCalendar;
