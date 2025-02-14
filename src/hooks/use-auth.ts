import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { create } from 'zustand'

import { authClient } from '@/lib/auth-client'

type OAuthLoadingStore = {
  isLoading: boolean
  setIsLoading: (isLoading: boolean) => void
}

const useOAuthLoadingStore = create<OAuthLoadingStore>((set) => ({
  isLoading: false,
  setIsLoading: (isLoading) => set({ isLoading }),
}))

export const useAuth = () => {
  const router = useRouter()

  const { signIn, signOut, useSession } = authClient

  const { isLoading, setIsLoading } = useOAuthLoadingStore()

  const handleSocialLogin = async (provider: 'github' | 'google', callbackURL?: string) => {
    await signIn.social(
      {
        provider,
        callbackURL: callbackURL || '/workspace',
      },
      {
        onRequest: () => {
          setIsLoading(true)
        },
        onSuccess: () => {
          setIsLoading(false)
          toast.success('Login successful')
        },
        onError: (ctx) => {
          setIsLoading(false)
          console.log(ctx)
          toast.error(ctx.error.message)
        },
      },
    )
  }

  const handleLogout = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push('/sign-in')
        },
      },
    })
  }

  return { handleSocialLogin, isLoading, handleLogout, useSession }
}
