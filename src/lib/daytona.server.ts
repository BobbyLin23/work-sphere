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
