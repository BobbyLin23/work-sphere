import { useNavigate } from "@tanstack/react-router"
import { useCallback } from "react"
import { toast } from "@/components/ui/toast"
import { isSubscriptionRequired } from "@/lib/billing"
import { isUsageLimitReached } from "@/lib/usage"

export function useBillingError() {
  const navigate = useNavigate()

  // Returns true when the error was a paywall or usage limit and a toast was
  // shown.
  return useCallback(
    (error: unknown) => {
      if (isSubscriptionRequired(error)) {
        toast.add({
          type: "error",
          title: "Upgrade required",
          description:
            "Bots and sandboxes are only available on the paid plan.",
          actionProps: {
            children: "View plans",
            onClick: () => navigate({ to: "/pricing" }),
          },
        })
        return true
      }
      if (isUsageLimitReached(error)) {
        toast.add({
          type: "error",
          title: "Usage limit reached",
          description: "You've used your allowance for this billing period.",
          actionProps: {
            children: "View usage",
            onClick: () => navigate({ to: "/usage" }),
          },
        })
        return true
      }
      return false
    },
    [navigate]
  )
}
