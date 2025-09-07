"use client";

import { useEffect, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

type ValuePiece = Date | null;

type Value = ValuePiece | [ValuePiece, ValuePiece];

const CalendarComponent = () => {
  const [value, onChange] = useState<Value>(new Date());
  const [events, setEvents] = useState<
    { id: number; title: string; startTime: string }[]
  >([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/events?page=1&limit=10");
        const json = await res.json();
        const list = Array.isArray(json?.events) ? json.events : json;
        setEvents(list || []);
      } catch (e) {
        setEvents([]);
      }
    };
    load();
  }, []);
  return (
    <div className="bg-white p-4 rounded-md text-gray-600">
      <Calendar onChange={onChange} value={value} />
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold my-4">Events</h1>
      </div>
      <div className="flex flex-col gap-2">
        {events.length === 0 && (
          <div className="text-xs text-gray-500">No events scheduled.</div>
        )}
        {events.map((e) => (
          <div
            key={e.id}
            className="text-xs flex justify-between bg-[#f3f6f3] rounded px-2 py-1"
          >
            <span>{e.title}</span>
            <span>{new Date(e.startTime).toLocaleDateString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarComponent;
