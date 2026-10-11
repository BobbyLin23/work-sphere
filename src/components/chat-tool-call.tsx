import { getToolName } from "ai"
import type { DynamicToolUIPart, ToolUIPart } from "ai"
import {
  FileTextIcon,
  FolderIcon,
  KeyboardIcon,
  MonitorIcon,
  MousePointerClickIcon,
  MousePointerIcon,
  MoveVerticalIcon,
  TerminalIcon,
  WrenchIcon,
} from "lucide-react"
import type { ReactNode } from "react"
import { CodeBlock } from "@/components/ai-elements/code-block"
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool"

type ToolPart = ToolUIPart | DynamicToolUIPart

const TOOL_TITLES: Record<string, string> = {
  bash: "Run command",
  readFile: "Read file",
  writeFile: "Write file",
  listFiles: "List files",
  mouseMove: "Move mouse",
  mouseClick: "Click",
  mouseScroll: "Scroll",
  keyboardType: "Type text",
  keyboardPress: "Press key",
  viewScreen: "View screen",
  showScreen: "Screen",
}

const TOOL_ICONS: Record<string, ReactNode> = {
  bash: <TerminalIcon className="size-4 text-muted-foreground" />,
  readFile: <FileTextIcon className="size-4 text-muted-foreground" />,
  writeFile: <FileTextIcon className="size-4 text-muted-foreground" />,
  listFiles: <FolderIcon className="size-4 text-muted-foreground" />,
  mouseMove: <MousePointerIcon className="size-4 text-muted-foreground" />,
  mouseClick: (
    <MousePointerClickIcon className="size-4 text-muted-foreground" />
  ),
  mouseScroll: <MoveVerticalIcon className="size-4 text-muted-foreground" />,
  keyboardType: <KeyboardIcon className="size-4 text-muted-foreground" />,
  keyboardPress: <KeyboardIcon className="size-4 text-muted-foreground" />,
  showScreen: <MonitorIcon className="size-4 text-muted-foreground" />,
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null

function summarize(name: string, input: unknown) {
  if (!isRecord(input)) return undefined
  switch (name) {
    case "bash":
      return typeof input.command === "string" ? input.command : undefined
    case "readFile":
    case "writeFile":
    case "listFiles":
      return typeof input.path === "string" ? input.path : undefined
    case "mouseMove":
    case "mouseClick":
    case "mouseScroll":
      return `${input.x}, ${input.y}`
    case "keyboardType":
      return typeof input.text === "string" ? input.text : undefined
    case "keyboardPress":
      return [
        ...(Array.isArray(input.modifiers) ? input.modifiers : []),
        input.key,
      ].join("+")
    default:
      return undefined
  }
}

function ToolCall({ part }: { part: ToolPart }) {
  const name = getToolName(part)

  // viewScreen is private to the agent; only surface it if it failed.
  if (name === "viewScreen" && part.state !== "output-error") {
    return null
  }

  if (
    name === "showScreen" &&
    part.state === "output-available" &&
    isRecord(part.output) &&
    typeof part.output.image === "string"
  ) {
    return (
      <img
        alt="Screenshot of the bot's screen"
        className="mb-4 h-auto max-w-full rounded-md border"
        src={`data:${part.output.mediaType};base64,${part.output.image}`}
      />
    )
  }

  const title = TOOL_TITLES[name] ?? name
  const summary = summarize(name, part.input)
  const header =
    part.type === "dynamic-tool"
      ? { type: part.type, state: part.state, toolName: part.toolName }
      : { type: part.type, state: part.state }

  return (
    <Tool>
      <ToolHeader
        title={summary ? `${title}: ${truncate(summary)}` : title}
        icon={TOOL_ICONS[name] ?? <WrenchIcon className="size-4" />}
        {...header}
      />
      <ToolContent>
        {name === "bash" && isRecord(part.input) ? (
          <BashContent part={part} />
        ) : (
          <>
            <ToolInput input={part.input} />
            {part.state === "output-available" && name !== "showScreen" && (
              <ToolOutput output={part.output} errorText={undefined} />
            )}
          </>
        )}
        {part.state === "output-error" && (
          <ToolOutput output={undefined} errorText={part.errorText} />
        )}
      </ToolContent>
    </Tool>
  )
}

function BashContent({ part }: { part: ToolPart }) {
  const command =
    isRecord(part.input) && typeof part.input.command === "string"
      ? part.input.command
      : ""
  const output =
    part.state === "output-available" && isRecord(part.output)
      ? part.output
      : undefined

  return (
    <>
      <div className="rounded-md bg-muted/50">
        <CodeBlock code={command} language="bash" />
      </div>
      {output && (
        <div className="space-y-2">
          <h4 className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
            Output (exit code {String(output.exitCode)})
          </h4>
          <div className="rounded-md bg-muted/50">
            <CodeBlock code={String(output.output ?? "")} language="log" />
          </div>
        </div>
      )}
    </>
  )
}

function truncate(text: string) {
  const line = text.split("\n")[0]
  return line.length > 60 ? `${line.slice(0, 60)}…` : line
}

export { ToolCall }
