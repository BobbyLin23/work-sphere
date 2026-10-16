import { Daytona } from "@daytona/sdk"

// Created on first use: Trigger.dev imports task files at deploy time, when
// DAYTONA_API_KEY is not set, and the constructor throws without it.
let client: Daytona | undefined
const getClient = () => {
  client ??= new Daytona({ apiUrl: process.env.DAYTONA_API_URL })
  return client
}

export async function createSandbox() {
  const sandbox = await getClient().create()
  try {
    const home = await sandbox.getUserHomeDir()
    await sandbox.fs.uploadFile(Buffer.alloc(0), `${home}/MEMORY.md`)
  } catch (error) {
    await sandbox.delete().catch(() => {})
    throw error
  }
  return sandbox.id
}

export async function deleteSandbox(sandboxId: string) {
  const sandbox = await getClient().get(sandboxId)
  await sandbox.delete()
}

export async function getStartedSandbox(sandboxId: string) {
  const sandbox = await getClient().get(sandboxId)
  if (sandbox.state !== "started") {
    await sandbox.start()
  }
  return sandbox
}

const NOVNC_PORT = 6080
const VNC_URL_TTL_SECONDS = 3600

export async function getVncUrl(sandboxId: string) {
  const sandbox = await getStartedSandbox(sandboxId)
  await sandbox.computerUse.start()
  const { url } = await sandbox.getSignedPreviewUrl(
    NOVNC_PORT,
    VNC_URL_TTL_SECONDS
  )
  return `${url}/vnc.html?autoconnect=true&resize=scale&reconnect=true`
}
