import Image from "next/image";
import { useState, useEffect, useRef } from "react";

interface TableSearchProps {
  onSearch?: (searchTerm: string) => void;
  placeholder?: string;
  ignoreEmpty?: boolean; // if true, don't call onSearch when input is empty
  debounceMs?: number;
}

const TableSearch = ({
  onSearch,
  placeholder = "Search...",
  ignoreEmpty = true,
  debounceMs = 600,
}: TableSearchProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  // Stable refs for props to keep effect deps constant
  const onSearchRef = useRef(onSearch);
  const ignoreEmptyRef = useRef(ignoreEmpty);
  const debounceRef = useRef(debounceMs);
  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);
  useEffect(() => {
    ignoreEmptyRef.current = ignoreEmpty;
  }, [ignoreEmpty]);
  useEffect(() => {
    debounceRef.current = debounceMs;
  }, [debounceMs]);

  // Skip first mount; debounce subsequent searches
  const didMountRef = useRef(false);
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    const timer = setTimeout(() => {
      const handler = onSearchRef.current;
      const ignoreEmptyVal = ignoreEmptyRef.current;
      if (!handler) return;
      if (ignoreEmptyVal && searchTerm.trim() === "") return;
      handler(searchTerm);
    }, debounceRef.current);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  return (
    <div className="w-full md:flex items-center gap-1 text-xs rounded-full ring-[1.5px] ring-gray-300 px-2">
      <Image src="/search.png" alt="Search" width={14} height={14} />
      <input
        type="text"
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-[200px] p-2 bg-white text-black rounded-full px-2 py-0.5 outline-none"
      />
      {searchTerm && (
        <button
          type="button"
          onClick={() => {
            setSearchTerm("");
            // Optionally trigger search with empty string when ignoreEmpty is false
            if (!ignoreEmptyRef.current && onSearchRef.current) {
              onSearchRef.current("");
            }
          }}
          className="text-gray-500 px-2"
          aria-label="Clear search"
          title="Clear"
        >
          ×
        </button>
      )}
    </div>
  );
};

export default TableSearch;
