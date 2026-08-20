import AppSidebar from "@/components/common/AppSidebar"
import AppHeader from "@/components/common/AppHeader"
import { SidebarProvider } from "@/components/ui/sidebar"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      {/* Fixed app header with a single scrolling content region beneath it, so
          full-height screens (e.g. Messages) can own their own inner scrolling. */}
      <main className="flex h-svh w-full min-w-0 flex-col overflow-hidden bg-background">
        <AppHeader />
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </main>
    </SidebarProvider>
  )
}
