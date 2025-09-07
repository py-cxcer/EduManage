"use client";

import { useSession } from "next-auth/react";
import ProtectedRoute from "../../../../View/components/ProtectedRoute";
import TableSearch from "@/View/components/TableSearch";
import Image from "next/image";
import Table from "@/View/components/Table";
import ActionForm from "@/View/components/ActionForm";

import { useEffect, useState } from "react";
import Pagination from "@/View/components/Pagination";

const columns = [
  {
    header: "Title",
    accessor: "title",
    className: "hidden md:table-cell",
  },
  {
    header: "Class",
    accessor: "class",
    className: "hidden md:table-cell",
  },
  {
    header: "Date",
    accessor: "date",
    className: "hidden md:table-cell",
  },
  {
    header: "Start Time",
    accessor: "startTime",
    className: "hidden md:table-cell",
  },
  {
    header: "End Time",
    accessor: "endTime",
    className: "hidden md:table-cell",
  },
  {
    header: "Actions",
    accessor: "actions",
  },
];

type EventInfo = {
  id: number;
  title: string;
  description: string;
  className: string;
  formattedDate: string;
  formattedStartTime: string;
  formattedEndTime: string;
};

const EventRow = ({ item }: { item: EventInfo }) => {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-[#EDF2DC] odd:bg-[#FAF9EE] text-sm hover:bg-[#F0E4D3]"
    >
      <td className="flex items-center gap-4 p-4">
        <div>
          <h3 className="font-semibold text-gray-500">{item.title}</h3>
        </div>
      </td>

      <td className="hidden md:table-cell text-gray-500">{item.className}</td>
      <td className="hidden md:table-cell text-gray-500">
        {item.formattedDate}
      </td>
      <td className="hidden md:table-cell text-gray-500">
        {item.formattedStartTime}
      </td>
      <td className="hidden md:table-cell text-gray-500">
        {item.formattedEndTime}
      </td>
      <td className="">
        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
              <ActionForm table="Event" type="update" id={item.id.toString()} />
              <ActionForm table="Event" type="delete" id={item.id.toString()} />
            </>
          )}
        </div>
      </td>
    </tr>
  );
};

const EventList = () => {
  const { data: session } = useSession();
  const [events, setEvents] = useState<EventInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const isAdmin = session?.user?.role === "ADMIN";
  const itemsPerPage = 7;

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch(
          `/api/events?page=${currentPage}&limit=${itemsPerPage}`
        );
        const data = await response.json();
        setEvents(data.events || data);
        setTotalPages(
          data.totalPages ||
            Math.ceil((data.events || data).length / itemsPerPage)
        );
        setTotalItems(data.totalItems || (data.events || data).length);
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setLoading(true);
  };

  const rowData = (item: EventInfo) => <EventRow key={item.id} item={item} />;

  if (loading) {
    return (
      <div className="bg-[#EEEFE0] p-4 rounded-md flex-1 m-4 mt-0 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading Events...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <div className="bg-[#EEEFE0] p-4 rounded-md flex-1 m-4 mt-0">
        <div className="flex items-center justify-between">
          <h1 className="hidden md:block text-lg font-semibold text-gray-500">
            All Events Information
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
              {isAdmin && <ActionForm table="Event" type="create" />}
            </div>
          </div>
        </div>
        <Table columns={columns} rowData={rowData} data={events} />
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
        />
      </div>
    </ProtectedRoute>
  );
};

export default EventList;
