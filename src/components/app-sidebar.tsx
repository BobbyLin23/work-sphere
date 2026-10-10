import { UserButton } from "@clerk/tanstack-react-start"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

const userButtonAppearance = {
  elements: {
    rootBox: cn("h-full! w-full!"),
    userButtonRoot: cn("h-full! w-full!"),
    userButtonBox: cn("justify-end! h-full! w-full! flex-row-reverse!"),
    userButtonTrigger: cn(
      "h-full! w-full! gap-2! rounded-md! p-2! shadow-none! focus-visible:shadow-none!"
    ),
    userButtonOuterIdentifier: cn(
      "truncate! m-0! text-sidebar-foreground! text-sm!"
    ),
    userButtonAvatarBox: cn("size-4!"),
  },
}

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarContent />
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton render={<div />} className="p-0">
              <UserButton showName appearance={userButtonAppearance} />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
