"use client";
import { useEffect, useMemo, useState } from "react";

interface ClassOption {
  id: number;
  label: string; // e.g., 1A, 2B, 3C
}

export default function ClassMultiSelect({
  value,
  onChange,
  placeholder = "Select classes...",
  disabled = false,
}: {
  value: number[];
  onChange: (ids: number[]) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [options, setOptions] = useState<ClassOption[]>([]);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    const fetchClasses = async () => {
      const res = await fetch("/api/classes?page=1&limit=1000");
      const data = await res.json();
      if (cancelled) return;
      const list = Array.isArray(data?.classes) ? data.classes : [];
      const mapped: ClassOption[] = list.map((c: any) => ({
        id: c.id,
        label: `${c.grade?.level || ""}${c.name}`,
      }));
      setOptions(mapped);
    };
    fetchClasses();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedSet = useMemo(() => new Set<number>(value || []), [value]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, search]);

  const toggle = (id: number) => {
    const next = new Set(selectedSet);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(Array.from(next));
  };

  return (
    <div className="flex flex-col gap-1 w-full">
      <label className="text-xs text-gray-700">Classes</label>
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((s) => !s)}
          className="w-full ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm bg-white text-black text-left"
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
                placeholder="Search classes..."
                className="w-full p-2 text-sm ring-[1.5px] ring-gray-300 rounded-md text-black"
              />
            </div>
            <ul className="p-2">
              {filtered.map((opt) => (
                <li key={opt.id} className="flex items-center gap-2 py-1">
                  <input
                    id={`class-${opt.id}`}
                    type="checkbox"
                    className="h-4 w-4"
                    checked={selectedSet.has(opt.id)}
                    onChange={() => toggle(opt.id)}
                  />
                  <label
                    htmlFor={`class-${opt.id}`}
                    className="text-sm text-gray-700"
                  >
                    {opt.label}
                  </label>
                </li>
              ))}
            </ul>
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
                {opt?.label || id}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
