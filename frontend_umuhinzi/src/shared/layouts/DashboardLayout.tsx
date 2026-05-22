import { Outlet } from 'react-router-dom'

export default function DashboardLayout() {
  return (
    <div className="flex min-h-screen bg-neutral-100 dark:bg-neutral-900">
      <aside className="w-64 shrink-0 border-r bg-white dark:bg-neutral-800">
        <div className="px-6 py-5">
          <span className="text-lg font-semibold text-primary-700 dark:text-primary-400">
            Umuhinzi Credit
          </span>
        </div>
        {/* RoleSidebar will be mounted here */}
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="border-b bg-white px-6 py-4 dark:bg-neutral-800">
          {/* DashboardHeader will be mounted here */}
        </header>
        <main className="flex-1 px-6 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
