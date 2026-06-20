export default function Card({ title, value, icon: Icon }) {
  return (
    <div className="card h-full">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <div className="rounded-xl bg-indigo-50 p-2 text-indigo-600">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight text-slate-800">{value}</p>
    </div>
  );
}