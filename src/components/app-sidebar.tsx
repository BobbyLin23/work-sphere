import { UserButton } from "@clerk/tanstack-react-start"
import { PlusIcon, UsersIcon } from "lucide-react"
import { useState } from "react"
import { BotDialog } from "@/components/bot-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
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
  const [botDialogOpen, setBotDialogOpen] = useState(false)

  return (
    <Sidebar>
      <SidebarHeader className="flex-row justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon" aria-label="New">
                <PlusIcon />
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-auto min-w-48">
            <DropdownMenuItem onClick={() => setBotDialogOpen(true)}>
              <PlusIcon />
              Create new bot
            </DropdownMenuItem>
            <DropdownMenuItem>
              <UsersIcon />
              Create group chat
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <BotDialog open={botDialogOpen} onOpenChange={setBotDialogOpen} />
      </SidebarHeader>
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
