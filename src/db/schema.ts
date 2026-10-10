import { nanoid } from "nanoid"
import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { createInsertSchema } from "drizzle-zod"
import { z } from "zod"

export const bots = pgTable(
  "bots",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid()),
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    avatar: text("avatar")
      .notNull()
      .$defaultFn(() => nanoid()),
    job: text("job").notNull(),
    instructions: text("instructions"),
    sandboxId: text("sandbox_id"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("bots_user_id_idx").on(table.userId)]
)

export const createBotSchema = createInsertSchema(bots, {
  name: (schema) => schema.trim().min(1, "Name is required").max(50),
  job: (schema) => schema.trim().min(1, "Job is required").max(100),
  instructions: z.string().trim().max(2000),
  avatar: (schema) => schema.min(1),
}).pick({ name: true, job: true, instructions: true, avatar: true })

export type CreateBotInput = z.infer<typeof createBotSchema>
