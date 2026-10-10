import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/tanstack-react-start"
import { auth } from "@clerk/tanstack-react-start/server"
import { createFileRoute, redirect } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { Button } from "@/components/ui/button"

const authStateFn = createServerFn().handler(async () => {
  const { isAuthenticated, userId } = await auth()
  if (!isAuthenticated) {
    throw redirect({ to: "/sign-in/$" })
  }
  return { userId }
})

export const Route = createFileRoute("/")({
  beforeLoad: async () => await authStateFn(),
  component: App,
})

function App() {
  return (
    <div className="flex min-h-svh flex-col gap-6 p-6">
      <header className="flex items-center justify-end gap-2">
        <Show when="signed-out">
          <SignInButton>
            <Button variant="outline">Sign in</Button>
          </SignInButton>
          <SignUpButton>
            <Button>Sign up</Button>
          </SignUpButton>
        </Show>
        <Show when="signed-in">
          <UserButton />
        </Show>
      </header>
      <div className="flex min-w-0 max-w-md flex-col gap-4 text-sm leading-loose">
        <div>
          <h1 className="font-medium">Project ready!</h1>
          <p>You may now add components and start building.</p>
        </div>
      </div>
    </div>
  )
}
