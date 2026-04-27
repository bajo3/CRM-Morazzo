import { useState } from "react";
import { Outlet } from "react-router-dom";

import { Sidebar } from "./sidebar";

export function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface text-ink">
      <div className="mx-auto flex min-h-screen max-w-[1600px] lg:flex-row">
        {/* Mobile top bar */}
        <div className="flex items-center justify-between border-b border-line bg-[#233235] px-4 py-3 lg:hidden">
          <span className="text-sm font-semibold text-white">Morazzo CRM</span>
          <button
            type="button"
            aria-label="Abrir menú"
            onClick={() => setSidebarOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20"
          >
            <MenuIcon />
          </button>
        </div>

        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 px-4 py-5 lg:px-8 lg:py-7">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 4.5h14M2 9h14M2 13.5h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
