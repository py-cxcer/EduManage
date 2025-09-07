"use client";
import { useEffect, useState } from "react";

type Ann = { id: number; title: string; description?: string; date: string };

const Announcement = () => {
  const [items, setItems] = useState<Ann[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/announcements?page=1&limit=5");
        const json = await res.json();
        const list = Array.isArray(json?.announcements)
          ? json.announcements
          : json;
        setItems(list || []);
      } catch (e) {
        setItems([]);
      }
    };
    load();
  }, []);

  return (
    <div className="bg-white p-4 rounded-md">
      <div className="flex item-center justify-between">
        <h1 className="text-xl font-semibold text-gray-400">Announcements</h1>
        <span className="text-xs text-gray-500"></span>
      </div>
      <div className="flex flex-col gap-4 mt-4">
        {items.length === 0 && (
          <div className="text-sm text-gray-500">No announcements.</div>
        )}
        {items.map((a) => (
          <div key={a.id} className="bg-[#dfe6df] rounded-md p-4 relative">
            <h2 className="font-medium text-gray-700 pr-24">{a.title}</h2>
            <span className="absolute top-3 right-3 text-xs text-black bg-white rounded-md px-2 py-1">
              {new Date(a.date).toLocaleDateString()}
            </span>
            {a.description && (
              <p className="text-xs text-gray-600 mt-1">{a.description}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Announcement;
