import { Hono } from 'hono'
import { handle } from 'hono/vercel'

import { auth } from '@/lib/auth'

const app = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null
    session: typeof auth.$Infer.Session.session | null
  }
}>()

app.use('*', async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers })
  console.log('auth baseURL', auth.options.baseURL)
  console.log('middleware session', session)
  if (!session) {
    c.set('user', null)
    c.set('session', null)
    return next()
  }

  c.set('session', session.session)
  c.set('user', session.user)
  return next()
})

app.on(['POST', 'GET'], '/api/auth/*', (c) => {
  return auth.handler(c.req.raw)
})

app.get('/hello', (c) => {
  return c.json({
    user: c.get('user'),
    session: c.get('session'),
    message: 'Hello Next.js!',
  })
})

export const GET = handle(app)
export const POST = handle(app)
