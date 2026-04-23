import { NavLink } from "react-router-dom";

import { cn } from "../../lib/cn";

const items = [
  { to: "/", label: "Dashboard" },
  { to: "/clientes", label: "Clientes" },
  { to: "/presupuestos", label: "Presupuestos" },
  { to: "/calculadora", label: "Calculadora" },
  { to: "/ordenes", label: "Ordenes" },
  { to: "/stock", label: "Stock" },
  { to: "/caja", label: "Caja" },
  { to: "/agenda", label: "Agenda" },
  { to: "/configuracion", label: "Precios" },
];

export function Sidebar() {
  return (
    <aside className="flex w-full flex-col gap-6 border-r border-stone-200 bg-[#233235] px-5 py-6 text-stone-50 lg:w-72">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-[0.22em] text-stone-300">CRM Vidrieria</p>
        <h1 className="text-2xl font-semibold tracking-tight">F. Morazzo</h1>
        <p className="text-sm text-stone-300">Operacion simple, venta clara y seguimiento diario.</p>
      </div>

      <nav className="space-y-1">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "block rounded-xl px-3 py-2.5 text-sm font-medium transition",
                isActive ? "bg-white/12 text-white" : "text-stone-300 hover:bg-white/8 hover:text-white",
              )
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
