import { useForm } from "@tanstack/react-form"
import { useNavigate, useRouter } from "@tanstack/react-router"
import { useServerFn } from "@tanstack/react-start"
import { nanoid } from "nanoid"
import { type ReactElement, useState } from "react"
import { ShuffleIcon, Trash2Icon } from "lucide-react"
import { ChatAvatar } from "@/components/chat-avatar"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { createBotSchema } from "@/db/schema"
import { createBot, deleteBot, updateBot } from "@/lib/bots"

const JOB_PRESETS = [
  {
    job: "Research assistant",
    instructions:
      "Find and summarize reliable information on the topics I ask about. Cite sources for every claim, flag anything uncertain or conflicting, and keep answers concise.",
  },
  {
    job: "Code reviewer",
    instructions:
      "Review the code I share for bugs, security issues, and readability. Point to the exact lines, explain why each issue matters, and suggest a concrete fix. Skip nitpicks unless I ask.",
  },
  {
    job: "Writing editor",
    instructions:
      "Edit my writing for clarity, tone, and grammar. Keep my voice, explain major changes briefly, and ask what the audience is if it isn't clear.",
  },
  {
    job: "Tutor",
    instructions:
      "Teach me step by step at my level. Explain concepts with simple examples, check my understanding with short questions, and let me try before giving the answer.",
  },
]

type EditableBot = {
  id: string
  name: string
  job: string
  instructions: string | null
  avatar: string
}

const initialValues = (bot?: EditableBot) => ({
  name: bot?.name ?? "",
  job: bot?.job ?? "",
  instructions: bot?.instructions ?? "",
  avatar: bot?.avatar ?? nanoid(),
})

function DeleteBotButton({ botId }: { botId: string }) {
  const router = useRouter()
  const navigate = useNavigate()
  const deleteBotFn = useServerFn(deleteBot)
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button type="button" variant="destructive" className="sm:mr-auto" />
        }
      >
        <Trash2Icon data-icon="inline-start" />
        Delete
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this bot?</AlertDialogTitle>
          <AlertDialogDescription>
            The bot and its chats will be permanently removed. This can't be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={pending}
            onClick={async () => {
              setPending(true)
              try {
                await deleteBotFn({ data: { id: botId } })
                await navigate({ to: "/" })
                await router.invalidate()
              } finally {
                setPending(false)
              }
            }}
          >
            {pending && <Spinner data-icon="inline-start" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function BotDialog({
  bot,
  trigger,
  open: openProp,
  onOpenChange,
}: {
  bot?: EditableBot
  trigger?: ReactElement
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = openProp ?? internalOpen
  const setOpen = (next: boolean) => {
    setInternalOpen(next)
    onOpenChange?.(next)
  }
  const router = useRouter()
  const createBotFn = useServerFn(createBot)
  const updateBotFn = useServerFn(updateBot)

  const form = useForm({
    defaultValues: initialValues(bot),
    validators: { onSubmit: createBotSchema },
    onSubmit: async ({ value }) => {
      if (bot) {
        await updateBotFn({ data: { ...value, id: bot.id } })
      } else {
        await createBotFn({ data: value })
      }
      await router.invalidate()
      setOpen(false)
      form.reset(bot ? value : initialValues())
    },
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) {
          form.reset(initialValues(bot))
        }
      }}
    >
      {trigger && <DialogTrigger render={trigger} />}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{bot ? "Edit bot" : "New bot"}</DialogTitle>
          <DialogDescription>
            {bot
              ? "Change its face, name, or job."
              : "Give it a face, a name, and a job to do."}
          </DialogDescription>
        </DialogHeader>
        <form
          id="bot-form"
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            form.handleSubmit()
          }}
        >
          <div className="flex flex-wrap gap-2">
            {JOB_PRESETS.map((preset) => (
              <Button
                key={preset.job}
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => {
                  form.setFieldValue("job", preset.job)
                  form.setFieldValue("instructions", preset.instructions)
                }}
              >
                {preset.job}
              </Button>
            ))}
          </div>
          <form.Field name="avatar">
            {(field) => (
              <div className="flex items-center gap-3">
                <ChatAvatar seed={field.state.value} className="size-12" />
                <div className="flex flex-1 flex-col">
                  <span className="font-medium text-sm">Face</span>
                  <span className="text-muted-foreground text-sm">
                    Shuffle until you find one you like.
                  </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => field.handleChange(nanoid())}
                >
                  <ShuffleIcon data-icon="inline-start" />
                  Shuffle
                </Button>
              </div>
            )}
          </form.Field>
          <FieldGroup>
            <form.Field name="name">
              {(field) => {
                const invalid =
                  field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field data-invalid={invalid}>
                    <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                    <Input
                      id={field.name}
                      placeholder="Ada"
                      value={field.state.value}
                      aria-invalid={invalid}
                      onBlur={field.handleBlur}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                    />
                    {invalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                )
              }}
            </form.Field>
            <form.Field name="job">
              {(field) => {
                const invalid =
                  field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field data-invalid={invalid}>
                    <FieldLabel htmlFor={field.name}>Job</FieldLabel>
                    <Input
                      id={field.name}
                      placeholder="Research assistant"
                      value={field.state.value}
                      aria-invalid={invalid}
                      onBlur={field.handleBlur}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                    />
                    {invalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                )
              }}
            </form.Field>
            <form.Field name="instructions">
              {(field) => {
                const invalid =
                  field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field data-invalid={invalid}>
                    <FieldLabel htmlFor={field.name}>
                      How it should work
                    </FieldLabel>
                    <Textarea
                      id={field.name}
                      rows={4}
                      placeholder="Answer briefly, cite sources, and ask before running anything destructive."
                      value={field.state.value ?? ""}
                      aria-invalid={invalid}
                      onBlur={field.handleBlur}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                    />
                    {invalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                )
              }}
            </form.Field>
          </FieldGroup>
        </form>
        <DialogFooter>
          {bot && <DeleteBotButton botId={bot.id} />}
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
              <Button type="submit" form="bot-form" disabled={isSubmitting}>
                {isSubmitting && <Spinner data-icon="inline-start" />}
                {bot ? "Save changes" : "Create bot"}
              </Button>
            )}
          </form.Subscribe>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { BotDialog }
export type { EditableBot }
