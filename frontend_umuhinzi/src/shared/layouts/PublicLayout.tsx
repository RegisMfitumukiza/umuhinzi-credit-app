import { Outlet } from 'react-router-dom'

export default function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-white px-6 py-4 dark:bg-neutral-900">
        <span className="text-lg font-semibold text-primary-700 dark:text-primary-400">
          Umuhinzi Credit
        </span>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <Outlet />
      </main>
      <footer className="border-t px-6 py-4 text-center text-sm text-neutral-500">
        © {new Date().getFullYear()} Umuhinzi Credit. All rights reserved.
      </footer>
    </div>
  )
}
