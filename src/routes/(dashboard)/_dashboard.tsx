import { Outlet, createFileRoute } from "@tanstack/react-router"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { getSidebarOpen } from "@/lib/sidebar"
import { getChatList } from "@/queries/bots"

export const Route = createFileRoute("/(dashboard)/_dashboard")({
  beforeLoad: async () => ({ sidebarOpen: await getSidebarOpen() }),
  loader: () => getChatList(),
  component: DashboardLayout,
})

function DashboardLayout() {
  const { sidebarOpen } = Route.useRouteContext()

  return (
    <SidebarProvider defaultOpen={sidebarOpen}>
      <AppSidebar />
      <SidebarInset>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  )
}
