const Table = ({
  columns,
  rowData,
  data,
}: {
  columns: { header: string; accessor: string; className?: string }[];
  rowData: (item: any) => React.ReactNode;
  data: any;
}) => {
  const rows = Array.isArray(data) ? data : [];
  return (
    <table className="w-full mt-4 ">
      <thead>
        <tr className="text-left text-gray-500 text-sm font-semibold">
          {columns.map((col) => (
            <th key={col.header} className={col.className}>
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td
              colSpan={columns.length}
              className="p-6 text-center text-gray-500"
            >
              No results found
            </td>
          </tr>
        ) : (
          rows.map((item) => rowData(item))
        )}
      </tbody>
    </table>
  );
};

export default Table;
