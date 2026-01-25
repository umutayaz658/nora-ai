import { TableWidget } from "@/types/goal";
import { Plus, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";

interface TableProps { data: TableWidget; onUpdate: (data: TableWidget) => void; onDelete: () => void; }

export default function Table({ data, onUpdate, onDelete }: TableProps) {
    const [localData, setLocalData] = useState(data);

    useEffect(() => {
        setLocalData(data);
    }, [data]);

    const handleChange = (newData: TableWidget) => {
        setLocalData(newData);
        onUpdate(newData);
    };

    const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
        const newRows = [...localData.rows];
        newRows[rowIndex] = [...newRows[rowIndex]]; // Copy row
        newRows[rowIndex][colIndex] = value;
        handleChange({ ...localData, rows: newRows });
    };

    const handleHeaderChange = (colIndex: number, value: string) => {
        const newCols = [...localData.columns];
        newCols[colIndex] = value;
        handleChange({ ...localData, columns: newCols });
    };
    const handleAddRow = () => {
        const newRow = new Array(localData.columns.length).fill("");
        handleChange({ ...localData, rows: [...localData.rows, newRow] });
    };
    const handleDeleteRow = (rowIndex: number) => {
        const newRows = localData.rows.filter((_, i) => i !== rowIndex);
        handleChange({ ...localData, rows: newRows });
    };
    return (
        <div className="w-full p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm group/widget overflow-hidden">
            <div className="flex justify-between items-start mb-3">
                <input
                    type="text"
                    value={localData.title}
                    onChange={(e) => handleChange({ ...localData, title: e.target.value })}
                    className="bg-transparent text-sm font-medium text-cyan-200 focus:outline-none focus:border-b border-cyan-500/50 w-full"
                    placeholder="Table Title"
                />
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr>
                            {localData.columns.map((col, i) => (
                                <th key={i} className="p-2 border-b border-white/10 text-xs font-semibold text-white/60 min-w-[100px]">
                                    <input
                                        type="text"
                                        value={col}
                                        onChange={(e) => handleHeaderChange(i, e.target.value)}
                                        className="bg-transparent w-full focus:outline-none focus:text-white border-b border-transparent focus:border-white/20"
                                    />
                                </th>
                            ))}
                            <th className="w-8 border-b border-white/10"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {localData.rows.map((row, rowIndex) => (
                            <tr key={rowIndex} className="group/row hover:bg-white/5 transition-colors">
                                {row.map((cell, colIndex) => (
                                    <td key={colIndex} className="p-2 border-b border-white/5 text-sm text-white/80">
                                        <input
                                            type="text"
                                            value={cell}
                                            onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                                            className="bg-transparent w-full focus:outline-none focus:text-white"
                                        />
                                    </td>
                                ))}
                                <td className="p-2 border-b border-white/5 text-center">
                                    <button
                                        onClick={() => handleDeleteRow(rowIndex)}
                                        className="opacity-0 group-hover/row:opacity-100 text-white/20 hover:text-red-400 transition-all"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <button
                onClick={handleAddRow}
                className="w-full mt-2 py-2 flex items-center justify-center gap-2 text-xs text-white/30 hover:text-white hover:bg-white/5 rounded transition-all border border-dashed border-white/10"
            >
                <Plus size={14} /> Add Row
            </button>
        </div>
    );
}
