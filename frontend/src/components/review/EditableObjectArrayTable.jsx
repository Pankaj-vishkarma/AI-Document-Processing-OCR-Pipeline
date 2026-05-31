import React from "react";

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
        <div className="space-y-3">
            {rows.length === 0 ? (
                <div className="text-sm text-gray-500">No table rows</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr>
                                {columns.map((col) => (
                                    <th key={col} className="text-left px-3 py-2 font-semibold text-gray-700 border-b">
                                        {col}
                                    </th>
                                ))}
                                <th className="px-3 py-2" />
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, ri) => (
                                <tr key={ri} className="border-b">
                                    {columns.map((col) => (
                                        <td key={col} className="px-3 py-2">
                                            <input
                                                value={row[col] ?? ""}
                                                onChange={(e) => handleCellChange(ri, col, e.target.value)}
                                                className="w-full bg-white border rounded px-2 py-1"
                                            />
                                        </td>
                                    ))}
                                    <td className="px-3 py-2">
                                        <button
                                            onClick={() => handleRemoveRow(ri)}
                                            className="text-red-600 hover:underline text-sm"
                                        >
                                            Remove
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <div>
                <button onClick={handleAddRow} className="bg-gray-900 text-white px-3 py-2 rounded">
                    Add Row
                </button>
            </div>
        </div>
    );
};

export default EditableObjectArrayTable;
