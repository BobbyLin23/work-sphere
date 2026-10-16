import { MonitorIcon } from "lucide-react"
import { BotDialog, type EditableBot } from "@/components/bot-dialog"
import { ChatAvatar } from "@/components/chat-avatar"
import { Button } from "@/components/ui/button"

type ChatHeaderProps = {
  name: string
  bot: EditableBot
  panelOpen: boolean
  onTogglePanel: () => void
}

function ChatHeader({ name, bot, panelOpen, onTogglePanel }: ChatHeaderProps) {
  return (
    <header className="flex h-10 items-center justify-between border-b bg-background px-3">
      <BotDialog
        bot={bot}
        trigger={
          <Button variant="ghost" size="sm" className="gap-2 px-1">
            <ChatAvatar seed={bot.avatar} className="size-5" />
            <span className="font-medium text-sm">{name}</span>
          </Button>
        }
      />
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Desktop"
        aria-pressed={panelOpen}
        onClick={onTogglePanel}
      >
        <MonitorIcon />
      </Button>
    </header>
  )
}

export { ChatHeader }
