import { NavLink } from "react-router-dom";

import { cn } from "../../lib/cn";

const items = [
  { to: "/", label: "Tablero", hint: "Hoy" },
  { to: "/clientes", label: "Clientes", hint: "Base" },
  { to: "/presupuestos", label: "Presupuestos", hint: "Ventas" },
  { to: "/ordenes", label: "Órdenes", hint: "Taller" },
  { to: "/caja", label: "Caja", hint: "Pagos" },
  { to: "/agenda", label: "Agenda", hint: "Entregas" },
  { to: "/stock", label: "Stock", hint: "Hojas" },
  { to: "/calculadora", label: "Calculadora", hint: "Rápida" },
  { to: "/configuracion", label: "Precios", hint: "Catálogos" },
];

export function Sidebar() {
  return (
    <aside className="flex w-full flex-col gap-6 border-r border-white/10 bg-[#233235] px-5 py-6 text-stone-50 lg:w-72">
      <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-[0_24px_60px_rgba(0,0,0,0.18)] backdrop-blur">
        <p className="text-[11px] uppercase tracking-[0.26em] text-stone-300">CRM Vidriería</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Facundo Morazzo</h1>
        <p className="mt-1.5 text-xs leading-5 text-stone-400">
          Presupuestos, órdenes, cobros y agenda en un solo lugar.
        </p>
      </div>

      <nav className="space-y-1">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition",
                isActive
                  ? "bg-[#d4ab67] text-[#1f2521] shadow-[0_18px_30px_rgba(212,171,103,0.25)]"
                  : "text-stone-300 hover:bg-white/8 hover:text-white",
              )
            }
          >
            <span>{item.label}</span>
            <span className="rounded-full bg-black/10 px-2 py-1 text-[10px] uppercase tracking-[0.14em]">{item.hint}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto rounded-[24px] border border-white/10 bg-white/5 p-4 text-sm text-stone-300">
        <p className="font-semibold text-white">Flujo de trabajo</p>
        <p className="mt-1.5 text-xs leading-5 text-stone-400">
          Cliente → Presupuesto → Orden → Pago → Entrega
        </p>
      </div>
    </aside>
  );
}
