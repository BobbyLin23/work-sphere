import { useForm } from "@tanstack/react-form"
import { useNavigate, useRouter } from "@tanstack/react-router"
import { useServerFn } from "@tanstack/react-start"
import { Trash2Icon } from "lucide-react"
import { type ReactElement, useState } from "react"
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
import { Checkbox } from "@/components/ui/checkbox"
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
import { createGroupChatSchema } from "@/db/schema"
import { createGroupChat, deleteGroupChat, updateGroupChat } from "@/lib/chats"

type GroupChatBot = {
  id: string
  name: string
  avatar: string
}

type EditableGroupChat = {
  id: string
  name: string
  botIds: string[]
}

const initialValues = (chat?: EditableGroupChat) => ({
  name: chat?.name ?? "",
  botIds: chat?.botIds ?? ([] as string[]),
})

function DeleteGroupChatButton({ chatId }: { chatId: string }) {
  const router = useRouter()
  const navigate = useNavigate()
  const deleteGroupChatFn = useServerFn(deleteGroupChat)
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
          <AlertDialogTitle>Delete this group chat?</AlertDialogTitle>
          <AlertDialogDescription>
            The group chat will be permanently removed. The bots in it are kept.
            This can't be undone.
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
                await deleteGroupChatFn({ data: { id: chatId } })
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

function GroupChatDialog({
  bots,
  chat,
  trigger,
  open: openProp,
  onOpenChange,
}: {
  bots: GroupChatBot[]
  chat?: EditableGroupChat
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
  const navigate = useNavigate()
  const createGroupChatFn = useServerFn(createGroupChat)
  const updateGroupChatFn = useServerFn(updateGroupChat)

  const form = useForm({
    defaultValues: initialValues(chat),
    validators: { onSubmit: createGroupChatSchema },
    onSubmit: async ({ value }) => {
      if (chat) {
        await updateGroupChatFn({ data: { ...value, id: chat.id } })
        await router.invalidate()
        setOpen(false)
        form.reset(value)
        return
      }
      const created = await createGroupChatFn({ data: value })
      await router.invalidate()
      setOpen(false)
      form.reset(initialValues())
      await navigate({ href: `/chats/${created.id}` })
    },
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) {
          form.reset(initialValues(chat))
        }
      }}
    >
      {trigger && <DialogTrigger render={trigger} />}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {chat ? "Edit group chat" : "New group chat"}
          </DialogTitle>
          <DialogDescription>
            {chat
              ? "Rename the group or change who is in it."
              : "Name the group and pick the bots to put in it."}
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
          {chat && <DeleteGroupChatButton chatId={chat.id} />}
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
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
                {chat ? "Save changes" : "Create group chat"}
              </Button>
            )}
          </form.Subscribe>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { GroupChatDialog }
export type { EditableGroupChat }
