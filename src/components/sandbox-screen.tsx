import { useServerFn } from "@tanstack/react-start"
import { RefreshCwIcon } from "lucide-react"
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
} from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import { getSandboxVncUrl } from "@/queries/sandbox"

type SandboxScreenContextValue = {
  setPreviewSlot: (element: HTMLElement | null) => void
  openFullscreen: () => void
}

const SandboxScreenContext = createContext<SandboxScreenContextValue | null>(
  null
)

function useSandboxScreen() {
  const context = useContext(SandboxScreenContext)
  if (!context) {
    throw new Error("Must be used within SandboxScreenProvider")
  }
  return context
}

function useElementRect(element: HTMLElement | null) {
  const [rect, setRect] = useState<DOMRect | null>(null)

  useLayoutEffect(() => {
    if (!element) {
      setRect(null)
      return
    }
    const update = () => setRect(element.getBoundingClientRect())
    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    window.addEventListener("resize", update)
    window.addEventListener("scroll", update, true)
    // Panel resizing moves the slot without resizing it, so also poll frames.
    let frame = requestAnimationFrame(function tick() {
      update()
      frame = requestAnimationFrame(tick)
    })
    return () => {
      observer.disconnect()
      window.removeEventListener("resize", update)
      window.removeEventListener("scroll", update, true)
      cancelAnimationFrame(frame)
    }
  }, [element])

  return rect
}

type SandboxScreenProviderProps = {
  chatId: string
  title: string
  enabled: boolean
  children: ReactNode
}

// The iframe is rendered once, fixed over whichever slot is active (panel
// preview or fullscreen dialog). Moving an iframe in the DOM reloads it, so it
// is positioned instead of reparented.
function SandboxScreenProvider({
  chatId,
  title,
  enabled,
  children,
}: SandboxScreenProviderProps) {
  const getUrl = useServerFn(getSandboxVncUrl)
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState(false)
  const [frameKey, setFrameKey] = useState(0)
  const [fullscreen, setFullscreen] = useState(false)
  const [previewSlot, setPreviewSlot] = useState<HTMLElement | null>(null)
  const [dialogSlot, setDialogSlot] = useState<HTMLElement | null>(null)

  const shouldLoad = enabled || fullscreen
  useEffect(() => {
    if (!shouldLoad || url) {
      return
    }
    let cancelled = false
    getUrl({ data: { chatId } })
      .then((result) => {
        if (!cancelled) {
          setUrl(result)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(true)
        }
      })
    return () => {
      cancelled = true
    }
  }, [shouldLoad, url, getUrl, chatId])

  const activeSlot = fullscreen ? dialogSlot : previewSlot
  const rect = useElementRect(activeSlot)

  return (
    <SandboxScreenContext.Provider
      value={{ setPreviewSlot, openFullscreen: () => setFullscreen(true) }}
    >
      {children}
      {url && (
        <iframe
          key={frameKey}
          src={url}
          title={title}
          tabIndex={fullscreen ? 0 : -1}
          allow="clipboard-read; clipboard-write"
          className={cn(
            "fixed z-[60] border-0 bg-background",
            !(rect && activeSlot) && "invisible",
            !fullscreen && "pointer-events-none"
          )}
          style={
            rect
              ? {
                  top: rect.top,
                  left: rect.left,
                  width: rect.width,
                  height: rect.height,
                }
              : undefined
          }
        />
      )}
      {error && !url && <span className="sr-only">Failed to load screen</span>}
      <Dialog
        open={fullscreen}
        modal={false}
        disablePointerDismissal
        onOpenChange={(open, eventDetails) => {
          if (!open && eventDetails.reason !== "close-press") {
            eventDetails.cancel()
            return
          }
          setFullscreen(open)
        }}
      >
        <DialogContent className="h-[calc(100svh-2rem)] max-w-[calc(100vw-2rem)] grid-rows-[auto_1fr] sm:max-w-[calc(100vw-2rem)]">
          <DialogHeader className="flex-row items-center gap-2">
            <DialogTitle>{title}</DialogTitle>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Reload screen"
              onClick={() => setFrameKey((key) => key + 1)}
            >
              <RefreshCwIcon />
            </Button>
          </DialogHeader>
          <div
            ref={setDialogSlot}
            className="flex min-h-0 items-center justify-center overflow-hidden rounded-lg bg-muted"
          >
            {!url && <Spinner />}
          </div>
        </DialogContent>
      </Dialog>
    </SandboxScreenContext.Provider>
  )
}

function SandboxScreenPreview({ title }: { title: string }) {
  const { setPreviewSlot, openFullscreen } = useSandboxScreen()

  return (
    <div className="flex h-full flex-col items-center gap-3 p-4">
      <button
        type="button"
        ref={setPreviewSlot}
        onClick={openFullscreen}
        aria-label={`Open ${title} in fullscreen`}
        className="flex aspect-4/3 w-full cursor-zoom-in items-center justify-center overflow-hidden rounded-xl border bg-muted focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
      />
      <span className="text-muted-foreground text-sm">{title}</span>
    </div>
  )
}

export { SandboxScreenPreview, SandboxScreenProvider }
