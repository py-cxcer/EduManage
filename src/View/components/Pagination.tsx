"use client";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
}

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
}: PaginationProps) => {
  // Coerce and sanitize values to avoid NaN and negative ranges
  const safeItemsPerPage =
    Number.isFinite(itemsPerPage) && itemsPerPage > 0 ? itemsPerPage : 1;
  const safeTotalItems =
    Number.isFinite(totalItems) && totalItems >= 0 ? totalItems : 0;
  const safeTotalPages =
    Number.isFinite(totalPages) && totalPages > 0
      ? totalPages
      : Math.max(1, Math.ceil(safeTotalItems / safeItemsPerPage));
  const safeCurrentPage =
    Number.isFinite(currentPage) && currentPage >= 1
      ? Math.min(currentPage, safeTotalPages)
      : 1;

  const startItem = (safeCurrentPage - 1) * safeItemsPerPage + 1;
  const endItem = Math.min(safeCurrentPage * safeItemsPerPage, safeTotalItems);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (safeTotalPages <= maxVisiblePages) {
      for (let i = 1; i <= safeTotalPages; i++) {
        pages.push(i);
      }
    } else {
      if (safeCurrentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(safeTotalPages);
      } else if (safeCurrentPage >= safeTotalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = safeTotalPages - 3; i <= safeTotalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = safeCurrentPage - 1; i <= safeCurrentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(safeTotalPages);
      }
    }

    return pages;
  };

  if (safeTotalPages <= 1) {
    return null;
  }

  return (
    <div className="p-4 flex items-center justify-between text-gray-500">
      <div className="text-sm text-gray-600">
        Showing {isNaN(startItem) ? 0 : startItem} to{" "}
        {isNaN(endItem) ? 0 : endItem} of {safeTotalItems} results
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(safeCurrentPage - 1)}
          disabled={safeCurrentPage === 1}
          className="py-2 px-4 rounded-md bg-[#dce8dc] text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#c8d8c8] transition-colors"
        >
          Prev
        </button>

        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, index) => (
            <button
              key={index}
              onClick={() => typeof page === "number" && onPageChange(page)}
              disabled={page === "..."}
              className={`px-3 py-1 rounded-sm text-sm font-medium transition-colors ${
                page === safeCurrentPage
                  ? "bg-[#819A91] text-white"
                  : page === "..."
                  ? "cursor-default"
                  : "bg-[#ccdbcc] hover:bg-[#b8cbb8] text-gray-700"
              }`}
            >
              {page}
            </button>
          ))}
        </div>

        <button
          onClick={() => onPageChange(safeCurrentPage + 1)}
          disabled={safeCurrentPage === safeTotalPages}
          className="py-2 px-4 rounded-md bg-[#dce8dc] text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#c8d8c8] transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Pagination;
