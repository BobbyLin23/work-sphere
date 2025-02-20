import { defineConfig } from 'drizzle-kit'
import { config } from 'dotenv'

const path = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.local'

config({ path })

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema/*',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
