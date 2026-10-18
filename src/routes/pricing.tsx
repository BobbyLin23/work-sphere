import { PricingTable } from "@clerk/tanstack-react-start"
import { Link, createFileRoute } from "@tanstack/react-router"
import { ArrowLeftIcon } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"

export const Route = createFileRoute("/pricing")({
  component: PricingPage,
})

function PricingPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 p-6 pt-12">
      <div className="flex flex-col gap-2">
        <Link
          to="/"
          className={buttonVariants({
            variant: "ghost",
            size: "sm",
            className: "-ml-2 w-fit",
          })}
        >
          <ArrowLeftIcon data-icon="inline-start" />
          Back
        </Link>
        <h1 className="font-semibold text-2xl">Choose a plan</h1>
        <p className="text-muted-foreground text-sm">
          Upgrade to create bots and use their sandboxes.
        </p>
      </div>
      <PricingTable />
    </main>
  )
}
