
import { FileSearch } from "lucide-react";

export default function EmptyState({
  title = "No data available",
  message = "There is nothing to display here yet.",
  action,
  onAction
}) {
  return (
    <div className="bg-[#111827] border border-slate-800 rounded-xl p-10 text-center">

      <div className="bg-blue-500/10 w-fit mx-auto p-4 rounded-full">
        <FileSearch
          size={32}
          className="text-blue-400"
        />
      </div>

      <h3 className="text-lg font-semibold mt-5">
        {title}
      </h3>

      <p className="text-slate-400 text-sm mt-2">
        {message}
      </p>

      {action && onAction && (
        <button
          onClick={onAction}
          className="mt-5 bg-blue-600 hover:bg-blue-700 px-5 py-2.5 rounded-lg transition"
        >
          {action}
        </button>
      )}

    </div>
  );
}
