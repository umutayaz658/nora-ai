import { TableWidget } from "@/types/goal";

export default function Table({ data }: { data: TableWidget }) {
    return (
        <div className="w-full overflow-hidden rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="px-4 py-3 bg-white/5 border-b border-white/10">
                <h4 className="text-sm font-medium text-cyan-200">{data.title}</h4>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="bg-white/5">
                            {data.columns.map((col, i) => (
                                <th key={i} className="px-4 py-2 font-medium text-white/60 text-xs uppercase tracking-wider">
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {data.rows.map((row, rI) => (
                            <tr key={rI} className="hover:bg-white/5 transition-colors">
                                {row.map((cell, cI) => (
                                    <td key={cI} className="px-4 py-2 text-white/80 whitespace-nowrap">
                                        {cell}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
