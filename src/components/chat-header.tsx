import { MonitorIcon } from "lucide-react"
import { BotDialog, type EditableBot } from "@/components/bot-dialog"
import { ChatAvatar } from "@/components/chat-avatar"
import { GroupChatAvatar } from "@/components/group-chat-avatar"
import { Button } from "@/components/ui/button"

type ChatHeaderProps = {
  name: string
  panelOpen: boolean
  onTogglePanel: () => void
} & (
  | { bot: EditableBot; groupAvatars?: undefined }
  | { bot?: undefined; groupAvatars: string[] }
)

function ChatHeader({
  name,
  bot,
  groupAvatars,
  panelOpen,
  onTogglePanel,
}: ChatHeaderProps) {
  return (
    <header className="flex h-10 items-center justify-between border-b bg-background px-3">
      {bot ? (
        <BotDialog
          bot={bot}
          trigger={
            <Button variant="ghost" size="sm" className="gap-2 px-1">
              <ChatAvatar seed={bot.avatar} className="size-5" />
              <span className="font-medium text-sm">{name}</span>
            </Button>
          }
        />
      ) : (
        <div className="flex items-center gap-2 px-1">
          <GroupChatAvatar seeds={groupAvatars} className="size-5" />
          <span className="font-medium text-sm">{name}</span>
        </div>
      )}
      {bot && (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Desktop"
          aria-pressed={panelOpen}
          onClick={onTogglePanel}
        >
          <MonitorIcon />
        </Button>
      )}
    </header>
  )
}

export { ChatHeader }
