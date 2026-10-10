import { Outlet, createFileRoute } from "@tanstack/react-router"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { getChatList } from "@/queries/bots"

export const Route = createFileRoute("/(dashboard)/_dashboard")({
  loader: () => getChatList(),
  component: DashboardLayout,
})

function DashboardLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  )
}
