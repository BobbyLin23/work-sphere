import { auth } from "@clerk/tanstack-react-start/server"
import { createFileRoute, redirect } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { PlusIcon } from "lucide-react"
import { BotDialog } from "@/components/bot-dialog"
import { ChatAvatar } from "@/components/chat-avatar"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

const authStateFn = createServerFn().handler(async () => {
  const { isAuthenticated, userId } = await auth()
  if (!isAuthenticated) {
    throw redirect({ to: "/sign-in/$" })
  }
  return { userId }
})

export const Route = createFileRoute("/(dashboard)/_dashboard/")({
  beforeLoad: async () => await authStateFn(),
  loader: () => ({ seed: crypto.randomUUID() }),
  component: App,
})

function App() {
  const { seed } = Route.useLoaderData()

  return (
    <div className="flex min-h-svh flex-col gap-6 p-6">
      <Empty>
        <EmptyHeader>
          <EmptyMedia>
            <ChatAvatar seed={seed} className="size-12" />
          </EmptyMedia>
          <EmptyTitle>Meet your first bot</EmptyTitle>
          <EmptyDescription>
            Every bot gets its own personality, memory, and face. Spin one up
            and start the conversation.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <BotDialog
            trigger={
              <Button variant="secondary">
                <PlusIcon data-icon="inline-start" />
                Create a new bot
              </Button>
            }
          />
        </EmptyContent>
      </Empty>
    </div>
  )
}
