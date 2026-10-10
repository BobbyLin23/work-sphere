import { UserButton } from "@clerk/tanstack-react-start"
import { getRouteApi } from "@tanstack/react-router"
import { formatDistanceToNowStrict } from "date-fns"
import { PlusIcon, UsersIcon } from "lucide-react"
import { useState } from "react"
import { BotDialog } from "@/components/bot-dialog"
import { ChatAvatar } from "@/components/chat-avatar"
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
  SidebarGroup,
  SidebarGroupContent,
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

const dashboardRoute = getRouteApi("/(dashboard)/_dashboard")

export function AppSidebar() {
  const chatList = dashboardRoute.useLoaderData()
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
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {chatList.map((chat) => (
                <SidebarMenuItem key={chat.id}>
                  <SidebarMenuButton size="lg" className="h-auto">
                    <ChatAvatar seed={chat.avatar} />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate font-medium">
                          {chat.name}
                        </span>
                        <span className="shrink-0 text-muted-foreground text-xs">
                          {formatDistanceToNowStrict(chat.lastMessageAt)}
                        </span>
                      </div>
                      <span className="truncate text-muted-foreground text-xs">
                        {chat.lastMessagePreview}
                      </span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
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
