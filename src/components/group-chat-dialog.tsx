import { useForm } from "@tanstack/react-form"
import { useNavigate, useRouter } from "@tanstack/react-router"
import { useServerFn } from "@tanstack/react-start"
import { ChatAvatar } from "@/components/chat-avatar"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { createGroupChatSchema } from "@/db/schema"
import { createGroupChat } from "@/lib/chats"

type GroupChatBot = {
  id: string
  name: string
  avatar: string
}

const initialValues = { name: "", botIds: [] as string[] }

function GroupChatDialog({
  bots,
  open,
  onOpenChange,
}: {
  bots: GroupChatBot[]
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const navigate = useNavigate()
  const createGroupChatFn = useServerFn(createGroupChat)

  const form = useForm({
    defaultValues: initialValues,
    validators: { onSubmit: createGroupChatSchema },
    onSubmit: async ({ value }) => {
      const chat = await createGroupChatFn({ data: value })
      await router.invalidate()
      onOpenChange(false)
      form.reset(initialValues)
      await navigate({ href: `/chats/${chat.id}` })
    },
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) {
          form.reset(initialValues)
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New group chat</DialogTitle>
          <DialogDescription>
            Name the group and pick the bots to put in it.
          </DialogDescription>
        </DialogHeader>
        <form
          id="group-chat-form"
          onSubmit={(event) => {
            event.preventDefault()
            form.handleSubmit()
          }}
        >
          <FieldGroup>
            <form.Field name="name">
              {(field) => {
                const invalid =
                  field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field data-invalid={invalid}>
                    <FieldLabel htmlFor="group-chat-name">Name</FieldLabel>
                    <Input
                      id="group-chat-name"
                      placeholder="Launch crew"
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
            <form.Field name="botIds">
              {(field) => {
                const invalid =
                  field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field data-invalid={invalid}>
                    <FieldLabel>Bots</FieldLabel>
                    {bots.length === 0 && (
                      <span className="text-muted-foreground text-sm">
                        Create a bot first.
                      </span>
                    )}
                    <div className="flex max-h-60 flex-col overflow-y-auto">
                      {bots.map((bot) => {
                        const checked = field.state.value.includes(bot.id)
                        return (
                          <div
                            key={bot.id}
                            className="flex items-center gap-3 rounded-md p-2 hover:bg-muted"
                          >
                            <Checkbox
                              id={`group-bot-${bot.id}`}
                              checked={checked}
                              onCheckedChange={(next) => {
                                field.handleBlur()
                                field.handleChange(
                                  next
                                    ? [...field.state.value, bot.id]
                                    : field.state.value.filter(
                                        (id) => id !== bot.id
                                      )
                                )
                              }}
                            />
                            <ChatAvatar seed={bot.avatar} />
                            <label
                              htmlFor={`group-bot-${bot.id}`}
                              className="flex-1 cursor-pointer text-sm"
                            >
                              {bot.name}
                            </label>
                          </div>
                        )
                      })}
                    </div>
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
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
              <Button
                type="submit"
                form="group-chat-form"
                disabled={isSubmitting}
              >
                {isSubmitting && <Spinner data-icon="inline-start" />}
                Create group chat
              </Button>
            )}
          </form.Subscribe>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { GroupChatDialog }
