import { ChatAvatar } from "@/components/chat-avatar"
import { cn } from "@/lib/utils"

const MAX_VISIBLE_AVATARS = 3

type GroupChatAvatarProps = {
  seeds: string[]
  className?: string
}

const LAYOUTS = {
  2: ["top-[20%] left-0", "top-[20%] right-0"],
  3: ["top-0 left-[23%]", "bottom-0 left-0", "right-0 bottom-0"],
  4: ["top-0 left-0", "top-0 right-0", "bottom-0 left-0", "right-0 bottom-0"],
} as const

const SIZES = { 2: "size-[60%]", 3: "size-[54%]", 4: "size-[50%]" } as const

// Same footprint as a single ChatAvatar: every item is sized relative to the
// square, so `className` (e.g. size-5) scales the whole group.
function GroupChatAvatar({ seeds, className }: GroupChatAvatarProps) {
  const overflow = Math.max(0, seeds.length - MAX_VISIBLE_AVATARS)
  const visible = seeds.slice(0, MAX_VISIBLE_AVATARS)
  const slots = Math.min(Math.max(visible.length + (overflow ? 1 : 0), 2), 4)
  const layout = LAYOUTS[slots as 2 | 3 | 4]
  const itemClass = cn(
    "absolute ring-1 ring-background",
    SIZES[slots as 2 | 3 | 4]
  )

  return (
    <div
      className={cn(
        "relative size-8 shrink-0 [container-type:size]",
        className
      )}
    >
      {visible.map((seed, index) => (
        <ChatAvatar
          key={seed}
          seed={seed}
          className={cn(itemClass, layout[index])}
        />
      ))}
      {overflow > 0 && (
        <span
          className={cn(
            itemClass,
            layout[visible.length],
            "flex items-center justify-center rounded-full bg-muted font-medium text-[20cqw] text-muted-foreground"
          )}
        >
          +{overflow}
        </span>
      )}
    </div>
  )
}

export { GroupChatAvatar }
