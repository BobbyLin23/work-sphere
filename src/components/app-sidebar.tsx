import { UserButton } from "@clerk/tanstack-react-start"
import { getRouteApi, useMatch, useNavigate } from "@tanstack/react-router"
import { formatDistanceToNowStrict } from "date-fns"
import {
  MoonIcon,
  PlusIcon,
  SearchIcon,
  SunIcon,
  UsersIcon,
} from "lucide-react"
import { useEffect, useState } from "react"
import { BotDialog } from "@/components/bot-dialog"
import { ChatAvatar } from "@/components/chat-avatar"
import { GroupChatAvatar } from "@/components/group-chat-avatar"
import { GroupChatDialog } from "@/components/group-chat-dialog"
import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
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
  SidebarRail,
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
      "truncate! group-data-[collapsible=icon]:hidden! m-0! text-sidebar-foreground! text-sm!"
    ),
    userButtonAvatarBox: cn("size-4!"),
  },
}

const dashboardRoute = getRouteApi("/(dashboard)/_dashboard")

type ChatSummary = ReturnType<typeof dashboardRoute.useLoaderData>[number]

function ChatSummaryContent({ chat }: { chat: ChatSummary }) {
  return (
    <>
      {chat.isGroup ? (
        <GroupChatAvatar seeds={chat.avatars} />
      ) : (
        <ChatAvatar seed={chat.avatars[0]} />
      )}
      <div className="flex min-w-0 flex-1 flex-col group-data-[collapsible=icon]:hidden">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate font-medium">{chat.name}</span>
          <span className="shrink-0 text-muted-foreground text-xs">
            {formatDistanceToNowStrict(chat.lastMessageAt)}
          </span>
        </div>
        <span className="truncate text-muted-foreground text-xs">
          {chat.lastMessagePreview}
        </span>
      </div>
    </>
  )
}

export function AppSidebar() {
  const chatList = dashboardRoute.useLoaderData()
  const [botDialogOpen, setBotDialogOpen] = useState(false)
  const [groupDialogOpen, setGroupDialogOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const navigate = useNavigate()
  const activeChatId = useMatch({
    from: "/(dashboard)/_dashboard/chats/$chatId",
    shouldThrow: false,
  })?.params.chatId
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  const openChat = (chatId: string) => {
    navigate({ href: `/chats/${chatId}` })
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setSearchOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [])

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex justify-end">
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
              <DropdownMenuItem onClick={() => setGroupDialogOpen(true)}>
                <UsersIcon />
                Create group chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <Button
          variant="outline"
          aria-label="Search"
          className="h-8 w-full justify-start gap-2 border-input bg-transparent px-2.5 py-1 font-normal text-base text-muted-foreground group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:border-transparent! group-data-[collapsible=icon]:bg-transparent! group-data-[collapsible=icon]:p-0! group-data-[collapsible=icon]:text-foreground group-data-[collapsible=icon]:hover:bg-muted! md:text-sm dark:group-data-[collapsible=icon]:hover:bg-muted/50!"
          onClick={() => setSearchOpen(true)}
        >
          <SearchIcon data-icon="inline-start" />
          <span className="group-data-[collapsible=icon]:hidden">Search</span>
          <KbdGroup className="ml-auto group-data-[collapsible=icon]:hidden">
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </KbdGroup>
        </Button>
        <BotDialog open={botDialogOpen} onOpenChange={setBotDialogOpen} />
        <GroupChatDialog
          bots={chatList
            .filter((chat) => !chat.isGroup)
            .map((chat) => ({
              id: chat.botId,
              name: chat.name,
              avatar: chat.avatars[0],
            }))}
          open={groupDialogOpen}
          onOpenChange={setGroupDialogOpen}
        />
        <CommandDialog
          open={searchOpen}
          onOpenChange={setSearchOpen}
          title="Search chats"
          description="Search your chats by name or message."
        >
          <Command>
            <CommandInput placeholder="Search chats..." />
            <CommandList>
              <CommandEmpty>No chats found.</CommandEmpty>
              <CommandGroup heading="Chats">
                {chatList.map((chat) => (
                  <CommandItem
                    key={chat.id}
                    value={`${chat.name} ${chat.lastMessagePreview} ${chat.id}`}
                    onSelect={() => {
                      setSearchOpen(false)
                      openChat(chat.id)
                    }}
                  >
                    <ChatSummaryContent chat={chat} />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </CommandDialog>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {chatList.map((chat) => (
                <SidebarMenuItem key={chat.id}>
                  <SidebarMenuButton
                    size="lg"
                    className="h-auto"
                    isActive={chat.id === activeChatId}
                    tooltip={chat.name}
                    onClick={() => openChat(chat.id)}
                  >
                    <ChatSummaryContent chat={chat} />
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
            <SidebarMenuButton
              render={<div />}
              className="p-0 group-data-[collapsible=icon]:p-0!"
            >
              <UserButton showName appearance={userButtonAppearance}>
                <UserButton.MenuItems>
                  <UserButton.Action
                    label={isDark ? "Light mode" : "Dark mode"}
                    labelIcon={
                      isDark ? <SunIcon size={16} /> : <MoonIcon size={16} />
                    }
                    onClick={() => setTheme(isDark ? "light" : "dark")}
                  />
                </UserButton.MenuItems>
              </UserButton>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
