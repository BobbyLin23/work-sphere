import { createServerFn } from "@tanstack/react-start"
import { getCookie } from "@tanstack/react-start/server"

export const getSidebarOpen = createServerFn({ method: "GET" }).handler(
  () => getCookie("sidebar_state") !== "false"
)
