function DataTable({ columns, data, onEdit, onDelete }) {
    return (
      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-3 font-medium">{col.label}</th>
              ))}
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-slate-700">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
                <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                  <button onClick={() => onEdit(row)} className="text-blue-600 hover:underline text-sm">Modifier</button>
                  <button onClick={() => onDelete(row)} className="text-red-600 hover:underline text-sm">Supprimer</button>
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr><td colSpan={columns.length + 1} className="px-4 py-6 text-center text-slate-400">Aucune donnée</td></tr>
            )}
          </tbody>
        </table>
      </div>
    );
  }
  
  export default DataTable;