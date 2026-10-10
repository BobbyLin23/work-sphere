import { Avatar, Style } from "@dicebear/core"
import gaze from "@dicebear/styles/gaze.json"
import { useMemo } from "react"
import { cn } from "@/lib/utils"

const gazeStyle = new Style(gaze)

type ChatAvatarProps = {
  seed: string
  animated?: boolean
  className?: string
}

function ChatAvatar({ seed, animated = false, className }: ChatAvatarProps) {
  const src = useMemo(
    () =>
      new Avatar(gazeStyle, {
        seed,
        size: 32,
        animationVariant: [animated ? "medium" : "none"],
      }).toDataUri(),
    [seed, animated]
  )

  return (
    <img
      src={src}
      alt=""
      width={32}
      height={32}
      className={cn("size-8 shrink-0 rounded-full", className)}
    />
  )
}

export { ChatAvatar }
