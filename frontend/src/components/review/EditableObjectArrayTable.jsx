import React from "react";
import { Plus, Trash2 } from "lucide-react";

const EditableObjectArrayTable = ({ rows = [], onChange }) => {
    const getColumns = () => {
        const cols = new Set();
        (rows || []).forEach((r) => {
            if (r && typeof r === "object") {
                Object.keys(r).forEach((k) => cols.add(k));
            }
        });
        return Array.from(cols);
    };

    const columns = getColumns();

    const handleCellChange = (rowIndex, colKey, value) => {
        const newRows = rows.map((r, i) => (i === rowIndex ? { ...r, [colKey]: value } : r));
        onChange(newRows);
    };

    const handleAddRow = () => {
        const newRow = {};
        columns.forEach((c) => (newRow[c] = ""));
        onChange([...(rows || []), newRow]);
    };

    const handleRemoveRow = (index) => {
        const newRows = rows.filter((_, i) => i !== index);
        onChange(newRows);
    };

    if (!Array.isArray(rows)) return null;

    return (
        <div className="flex flex-col gap-3">
            {rows.length === 0 ? (
                <p className="text-xs text-gray-400 py-2">No table rows</p>
            ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                {columns.map((col) => (
                                    <th
                                        key={col}
                                        className="text-left px-3 py-2.5 text-xs font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap"
                                    >
                                        {col}
                                    </th>
                                ))}
                                <th className="px-3 py-2.5 w-10" />
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, ri) => (
                                <tr
                                    key={ri}
                                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
                                >
                                    {columns.map((col) => (
                                        <td key={col} className="px-3 py-2">
                                            <input
                                                value={row[col] ?? ""}
                                                onChange={(e) => handleCellChange(ri, col, e.target.value)}
                                                className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm text-gray-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all min-w-[80px]"
                                            />
                                        </td>
                                    ))}
                                    <td className="px-3 py-2">
                                        <button
                                            onClick={() => handleRemoveRow(ri)}
                                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition-colors"
                                            title="Remove row"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <button
                onClick={handleAddRow}
                className="self-start flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-100 hover:border-gray-300 transition-colors"
            >
                <Plus size={12} />
                Add Row
            </button>
        </div>
    );
};

export default EditableObjectArrayTable;