
export default function StatCard({
  title,
  value,
  icon: Icon,
  color = "text-blue-400",
  bg = "bg-blue-500/10"
}) {
  return (
    <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 hover:border-slate-600 transition">

      <div className="flex justify-between items-center">
        <p className="text-slate-400 text-sm">
          {title}
        </p>

        {Icon && (
          <div className={`p-3 rounded-lg ${bg}`}>
            <Icon className={color} size={22} />
          </div>
        )}
      </div>

      <h2 className="text-3xl font-bold mt-5">
        {value}
      </h2>

    </div>
  );
}
