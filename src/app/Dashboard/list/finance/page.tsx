"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import ProtectedRoute from "@/View/components/ProtectedRoute";
import Table from "@/View/components/Table";
import TableSearch from "@/View/components/TableSearch";
import Pagination from "@/View/components/Pagination";
import ActionForm from "@/View/components/ActionForm";
import { useSession } from "next-auth/react";

const columns = [
  {
    header: "Student",
    accessor: "studentName",
    className: "hidden md:table-cell",
  },
  { header: "Class", accessor: "className", className: "hidden md:table-cell" },
  {
    header: "Fees (amount)",
    accessor: "amount",
    className: "hidden md:table-cell",
  },
  {
    header: "Date",
    accessor: "formattedDate",
    className: "hidden md:table-cell",
  },
  { header: "Status", accessor: "status", className: "hidden md:table-cell" },
  { header: "Actions", accessor: "actions" },
];

type PaymentInfo = {
  id: number;
  studentName: string;
  className: string;
  amount: number;
  formattedDate: string;
  status: "PAID" | "NOT_PAID";
};

const Row = ({ item }: { item: PaymentInfo }) => {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  return (
    <tr className="border-b border-gray-200 even:bg-[#EDF2DC] odd:bg-[#FAF9EE] text-sm text-gray-700 hover:bg-[#F0E4D3]">
      <td className="p-4">{item.studentName}</td>
      <td className="hidden md:table-cell text-gray-500">{item.className}</td>
      <td className="hidden md:table-cell text-gray-500">{item.amount}</td>
      <td className="hidden md:table-cell text-gray-500">
        {item.formattedDate}
      </td>
      <td className="hidden md:table-cell text-gray-500">
        {item.status === "PAID" ? (
          <span className="text-green-700">Paid</span>
        ) : (
          <span className="text-red-700">Not Paid</span>
        )}
      </td>
      <td>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
              <ActionForm
                table="Finance"
                type="update"
                id={item.id.toString()}
              />
              <ActionForm
                table="Finance"
                type="delete"
                id={item.id.toString()}
              />
            </>
          )}
        </div>
      </td>
    </tr>
  );
};

export default function FinanceList() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const [items, setItems] = useState<PaymentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 7;

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(
          `/api/finance?page=${currentPage}&limit=${itemsPerPage}`
        );
        const data = await res.json();
        setItems(data.payments || data);
        setTotalPages(data.totalPages || 1);
        setTotalItems(data.totalItems || (data.payments || []).length);
      } catch (e) {
        console.error("Failed to fetch finance", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentPage]);

  if (loading) {
    return (
      <div className="bg-[#EEEFE0] p-4 rounded-md flex-1 m-4 mt-0 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading Finance...</p>
        </div>
      </div>
    );
  }

  const rowData = (item: PaymentInfo) => <Row key={item.id} item={item} />;

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <div className="bg-[#EEEFE0] p-4 rounded-md flex-1 m-4 mt-0">
        <div className="flex items-center justify-between">
          <h1 className="hidden md:block text-lg font-semibold text-gray-500">
            Finance
          </h1>
          <div className="flex flex-col md:flex-row items-center gap-4 text-gray-500 w-full md:w-auto">
            <TableSearch />
            <div className="flex items-center gap-4 self-end">
              <button className="w-8 h-8 flex items-center justify-center rounded-full bg-[#FFF2C2]">
                <Image src="/filter.png" alt="" width={14} height={14} />
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-full bg-[#FFF2C2]">
                <Image src="/sort.png" alt="" width={14} height={14} />
              </button>
              {isAdmin && <ActionForm table="Finance" type="create" />}
            </div>
          </div>
        </div>
        <Table columns={columns} rowData={rowData} data={items} />
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
        />
      </div>
    </ProtectedRoute>
  );
}
