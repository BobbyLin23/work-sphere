import { Daytona } from "@daytona/sdk"

const daytona = new Daytona({ apiUrl: process.env.DAYTONA_API_URL })

export async function createSandbox() {
  const sandbox = await daytona.create()
  return sandbox.id
}

export async function deleteSandbox(sandboxId: string) {
  const sandbox = await daytona.get(sandboxId)
  await sandbox.delete()
}

export async function getStartedSandbox(sandboxId: string) {
  const sandbox = await daytona.get(sandboxId)
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
