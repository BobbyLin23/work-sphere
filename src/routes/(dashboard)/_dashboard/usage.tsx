import { Link, createFileRoute } from "@tanstack/react-router"
import { format } from "date-fns"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { getUsage } from "@/queries/usage"

export const Route = createFileRoute("/(dashboard)/_dashboard/usage")({
  loader: () => getUsage(),
  component: UsagePage,
})

const numberFormat = new Intl.NumberFormat("en-US")

function formatHours(seconds: number) {
  return `${(seconds / 3600).toFixed(1)} h`
}

function Meter({
  title,
  description,
  used,
  limit,
  format: formatValue,
}: {
  title: string
  description: string
  used: number
  limit: number
  format: (value: number) => string
}) {
  const percent = Math.min(100, (used / limit) * 100)
  const exhausted = used >= limit

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Progress value={percent} aria-label={title} className="gap-0" />
        <div className="flex justify-between text-sm">
          <span className={cn(exhausted && "text-destructive")}>
            {formatValue(used)} used
          </span>
          <span className="text-muted-foreground">
            {formatValue(limit)} limit
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

function UsagePage() {
  const usage = Route.useLoaderData()
  const { aiTokens, sandboxSeconds, bots } = usage.meters

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-semibold text-2xl">Usage</h1>
        <p className="text-muted-foreground text-sm">
          {format(new Date(usage.periodStart), "MMM d")} to{" "}
          {format(new Date(usage.periodEnd), "MMM d, yyyy")}. Usage resets when
          your subscription renews.
        </p>
      </div>
      {!usage.subscribed && (
        <div className="flex items-center justify-between gap-4 rounded-lg border p-4 text-sm">
          <span>Bots and sandboxes are only available on the paid plan.</span>
          <Link to="/pricing" className={buttonVariants({ size: "sm" })}>
            View plans
          </Link>
        </div>
      )}
      <Meter
        title="AI tokens"
        description="Input and output tokens used by your bots."
        used={aiTokens.used}
        limit={aiTokens.limit}
        format={(value) => numberFormat.format(value)}
      />
      <Meter
        title="Sandbox time"
        description="Time your bots spend working in their sandboxes."
        used={sandboxSeconds.used}
        limit={sandboxSeconds.limit}
        format={formatHours}
      />
      <Meter
        title="Bots"
        description="Each bot has its own sandbox."
        used={bots.used}
        limit={bots.limit}
        format={(value) => numberFormat.format(value)}
      />
    </div>
  )
}
