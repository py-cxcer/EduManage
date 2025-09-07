"use client";
import { useEffect, useMemo, useState } from "react";

interface TeacherOption {
  id: string;
  name: string;
}

interface TeacherMultiSelectProps {
  value: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
}

export default function TeacherMultiSelect({
  value,
  onChange,
  placeholder = "Select teacher(s)...",
  disabled = false,
  label = "Teachers",
}: TeacherMultiSelectProps) {
  const [options, setOptions] = useState<TeacherOption[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    const fetchTeachers = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/teachers?page=1&limit=1000");
        const data = await res.json();
        if (cancelled) return;
        const list = Array.isArray(data?.teachers)
          ? data.teachers
          : Array.isArray(data)
          ? data
          : [];
        const mapped: TeacherOption[] = list.map((t: any) => ({
          id: String(t.id),
          name: `${t.name} ${t.surname}`.trim(),
        }));
        setOptions(mapped);
      } catch (e) {
        if (!cancelled) setError("Failed to load teachers");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchTeachers();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedSet = useMemo(() => new Set<string>(value || []), [value]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) => o.name.toLowerCase().includes(q) || o.id.toLowerCase().includes(q)
    );
  }, [options, search]);

  const toggle = (id: string) => {
    const next = new Set(selectedSet);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(Array.from(next));
  };

  return (
    <div className="flex flex-col gap-1 w-full md:w-1/2">
      <label className="text-xs text-gray-700">{label}</label>
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((s) => !s)}
          className="w-full ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm bg-white text-black text-left"
          aria-expanded={open}
        >
          {value?.length ? `${value.length} selected` : placeholder}
        </button>
        {open && (
          <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
            <div className="p-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search teachers..."
                className="w-full p-2 text-sm ring-[1.5px] ring-gray-300 rounded-md text-black"
              />
            </div>
            {loading ? (
              <div className="p-3 text-sm text-gray-500">Loading...</div>
            ) : error ? (
              <div className="p-3 text-sm text-red-500">{error}</div>
            ) : filtered.length === 0 ? (
              <div className="p-3 text-sm text-gray-500">No teachers</div>
            ) : (
              <ul className="p-2">
                {filtered.map((opt) => (
                  <li key={opt.id} className="flex items-center gap-2 py-1">
                    <input
                      id={`teacher-${opt.id}`}
                      type="checkbox"
                      className="h-4 w-4"
                      checked={selectedSet.has(opt.id)}
                      onChange={() => toggle(opt.id)}
                    />
                    <label
                      htmlFor={`teacher-${opt.id}`}
                      className="text-sm text-gray-700"
                    >
                      {opt.name}
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
      {value?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {value.map((id) => {
            const opt = options.find((o) => o.id === id);
            return (
              <span
                key={id}
                className="px-2 py-0.5 text-xs bg-[#e6efe6] rounded"
              >
                {opt?.name || id}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
