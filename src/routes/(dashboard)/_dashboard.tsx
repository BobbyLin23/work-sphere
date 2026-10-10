import { Outlet, createFileRoute } from "@tanstack/react-router"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export const Route = createFileRoute("/(dashboard)/_dashboard")({
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
