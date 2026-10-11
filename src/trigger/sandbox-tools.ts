import { tool } from "ai"
import { z } from "zod"
import { getStartedSandbox } from "../lib/daytona.server"

const MAX_OUTPUT_CHARS = 20_000

function truncate(text: string) {
  return text.length > MAX_OUTPUT_CHARS
    ? `${text.slice(0, MAX_OUTPUT_CHARS)}\n…[truncated ${text.length - MAX_OUTPUT_CHARS} characters]`
    : text
}

export function createSandboxTools(sandboxId: string | null | undefined) {
  let sandboxPromise: ReturnType<typeof getStartedSandbox> | undefined

  const getSandbox = () => {
    if (!sandboxId) {
      throw new Error("This bot has no sandbox")
    }
    sandboxPromise ??= getStartedSandbox(sandboxId)
    return sandboxPromise
  }

  const getDesktop = async () => {
    const sandbox = await getSandbox()
    await sandbox.computerUse.start()
    return sandbox.computerUse
  }

  const captureScreen = async () => {
    const desktop = await getDesktop()
    const [shot, info] = await Promise.all([
      desktop.screenshot.takeCompressed({
        format: "jpeg",
        quality: 60,
        showCursor: true,
      }),
      desktop.display.getInfo(),
    ])
    const display = info.displays?.[0]
    return {
      image: shot.screenshot ?? "",
      mediaType: "image/jpeg" as const,
      width: display?.width,
      height: display?.height,
    }
  }

  return {
    bash: tool({
      description:
        "Run a shell command in your sandbox. Returns the exit code and combined output.",
      inputSchema: z.object({
        command: z.string().describe("The shell command to run"),
        cwd: z
          .string()
          .optional()
          .describe("Working directory. Defaults to the home directory."),
        timeoutSeconds: z
          .number()
          .int()
          .min(1)
          .max(300)
          .optional()
          .describe("Give up after this many seconds. Defaults to 60."),
      }),
      execute: async ({ command, cwd, timeoutSeconds }) => {
        const sandbox = await getSandbox()
        const response = await sandbox.process.executeCommand(
          command,
          cwd,
          undefined,
          timeoutSeconds ?? 60
        )
        return {
          exitCode: response.exitCode,
          output: truncate(response.result),
        }
      },
    }),
    readFile: tool({
      description: "Read a text file from your sandbox.",
      inputSchema: z.object({
        path: z.string().describe("Absolute path, or relative to home"),
      }),
      execute: async ({ path }) => {
        const sandbox = await getSandbox()
        const content = await sandbox.fs.downloadFile(path)
        return { path, content: truncate(content.toString("utf8")) }
      },
    }),
    writeFile: tool({
      description:
        "Write a text file in your sandbox, replacing it if it exists.",
      inputSchema: z.object({
        path: z.string().describe("Absolute path, or relative to home"),
        content: z.string().describe("The full file contents"),
      }),
      execute: async ({ path, content }) => {
        const sandbox = await getSandbox()
        await sandbox.fs.uploadFile(Buffer.from(content, "utf8"), path)
        return { path, bytesWritten: Buffer.byteLength(content, "utf8") }
      },
    }),
    listFiles: tool({
      description: "List the files and folders in a directory of your sandbox.",
      inputSchema: z.object({
        path: z
          .string()
          .default(".")
          .describe("Directory path. Defaults to the home directory."),
      }),
      execute: async ({ path }) => {
        const sandbox = await getSandbox()
        const files = await sandbox.fs.listFiles(path)
        return {
          path,
          entries: files.map((file) => ({
            name: file.name,
            isDir: file.isDir,
            size: file.size,
          })),
        }
      },
    }),
    mouseMove: tool({
      description: "Move the mouse pointer to a point on the screen.",
      inputSchema: z.object({
        x: z.number().int().describe("Pixels from the left edge"),
        y: z.number().int().describe("Pixels from the top edge"),
      }),
      execute: async ({ x, y }) => {
        const desktop = await getDesktop()
        await desktop.mouse.move(x, y)
        return { x, y }
      },
    }),
    mouseClick: tool({
      description: "Click the mouse at a point on the screen.",
      inputSchema: z.object({
        x: z.number().int().describe("Pixels from the left edge"),
        y: z.number().int().describe("Pixels from the top edge"),
        button: z.enum(["left", "right", "middle"]).default("left"),
        double: z.boolean().default(false).describe("Double-click"),
      }),
      execute: async ({ x, y, button, double }) => {
        const desktop = await getDesktop()
        await desktop.mouse.click(x, y, button, double)
        return { x, y, button, double }
      },
    }),
    mouseScroll: tool({
      description: "Scroll the mouse wheel at a point on the screen.",
      inputSchema: z.object({
        x: z.number().int().describe("Pixels from the left edge"),
        y: z.number().int().describe("Pixels from the top edge"),
        direction: z.enum(["up", "down"]),
        amount: z.number().int().min(1).max(50).default(3),
      }),
      execute: async ({ x, y, direction, amount }) => {
        const desktop = await getDesktop()
        await desktop.mouse.scroll(x, y, direction, amount)
        return { x, y, direction, amount }
      },
    }),
    keyboardType: tool({
      description:
        "Type text at the current keyboard focus. Use keyboardPress for keys like Enter or shortcuts.",
      inputSchema: z.object({ text: z.string() }),
      execute: async ({ text }) => {
        const desktop = await getDesktop()
        await desktop.keyboard.type(text)
        return { typed: text }
      },
    }),
    keyboardPress: tool({
      description:
        "Press a single key, optionally with modifiers, for example enter, tab, escape, or c with ctrl.",
      inputSchema: z.object({
        key: z.string().describe("Key name such as enter, tab, escape, a, f5"),
        modifiers: z
          .array(z.enum(["ctrl", "alt", "shift", "cmd"]))
          .default([])
          .describe("Modifier keys held while pressing the key"),
      }),
      execute: async ({ key, modifiers }) => {
        const desktop = await getDesktop()
        await desktop.keyboard.press(key, modifiers)
        return { key, modifiers }
      },
    }),
    viewScreen: tool({
      description:
        "Look at the screen yourself. The image is only visible to you, not to the user. Take one before clicking, and after actions to check the result. Coordinates for mouse tools are pixels in this image.",
      inputSchema: z.object({}),
      execute: captureScreen,
      toModelOutput: ({ output }) => ({
        type: "content",
        value: [
          {
            type: "text",
            text: output.width
              ? `Screen is ${output.width}x${output.height} pixels.`
              : "Screenshot attached.",
          },
          {
            type: "file",
            mediaType: output.mediaType,
            data: { type: "data", data: output.image },
          },
        ],
      }),
    }),
    showScreen: tool({
      description:
        "Show the current screen to the user in the chat. Use it when the user asks what is on the screen or wants to see it. Use viewScreen to look at it yourself.",
      inputSchema: z.object({}),
      execute: captureScreen,
      toModelOutput: () => ({
        type: "text",
        value: "The screenshot is now shown to the user.",
      }),
    }),
  }
}
