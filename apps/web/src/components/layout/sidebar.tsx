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

type SidebarProps = {
  open?: boolean;
  onClose?: () => void;
};

export function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {open ? (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-72 flex-col gap-5 border-r border-white/10 bg-[#233235] px-5 py-6 text-stone-50 transition-transform duration-200",
          "lg:static lg:z-auto lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* Brand */}
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-4 shadow-[0_24px_60px_rgba(0,0,0,0.18)] backdrop-blur">
          <p className="text-[11px] uppercase tracking-[0.26em] text-stone-300">CRM Vidriería</p>
          <h1 className="mt-1.5 text-xl font-semibold tracking-tight text-white">Facundo Morazzo</h1>
          <p className="mt-1 text-xs leading-5 text-stone-400">
            Presupuestos, órdenes, cobros y agenda.
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  "flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-[#d4ab67] text-[#1f2521] shadow-[0_8px_20px_rgba(212,171,103,0.30)]"
                    : "text-stone-300 hover:bg-white/8 hover:text-white",
                )
              }
            >
              <span>{item.label}</span>
              <span className="rounded-full bg-black/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em]">
                {item.hint}
              </span>
            </NavLink>
          ))}
        </nav>

        {/* Footer hint */}
        <div className="rounded-[20px] border border-white/10 bg-white/5 p-3.5 text-sm text-stone-300">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-400">Flujo</p>
          <p className="mt-1 text-xs leading-5 text-stone-400">
            Cliente → Presupuesto → Orden → Pago → Entrega
          </p>
        </div>
      </aside>
    </>
  );
}
