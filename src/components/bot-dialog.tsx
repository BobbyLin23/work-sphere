import { useForm } from "@tanstack/react-form"
import { useRouter } from "@tanstack/react-router"
import { useServerFn } from "@tanstack/react-start"
import { nanoid } from "nanoid"
import { type ReactElement, useState } from "react"
import { ShuffleIcon } from "lucide-react"
import { ChatAvatar } from "@/components/chat-avatar"
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
import { createBot } from "@/lib/bots"

const JOB_PRESETS = [
  "Research assistant",
  "Code reviewer",
  "Writing editor",
  "Tutor",
]

const emptyValues = () => ({
  name: "",
  job: "",
  instructions: "",
  avatar: nanoid(),
})

function BotDialog({ trigger }: { trigger: ReactElement }) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const createBotFn = useServerFn(createBot)

  const form = useForm({
    defaultValues: emptyValues(),
    validators: { onSubmit: createBotSchema },
    onSubmit: async ({ value }) => {
      await createBotFn({ data: value })
      await router.invalidate()
      setOpen(false)
    },
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) {
          form.reset(emptyValues())
        }
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New bot</DialogTitle>
          <DialogDescription>
            Give it a face, a name, and a job to do.
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
                key={preset}
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => form.setFieldValue("job", preset)}
              >
                {preset}
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
                Create bot
              </Button>
            )}
          </form.Subscribe>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { BotDialog }
