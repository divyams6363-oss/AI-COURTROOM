
import { LoaderCircle } from "lucide-react";

export default function Loading({
  message = "Loading, please wait..."
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-4">

      <LoaderCircle
        size={35}
        className="text-blue-400 animate-spin"
      />

      <p className="text-slate-400 text-sm">
        {message}
      </p>

    </div>
  );
}
