import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useMutation } from '@tanstack/react-query'

import { authClient } from '@/lib/auth-client'

export const useAuth = () => {
  const router = useRouter()

  const { signIn, signOut, useSession } = authClient

  const { mutate: handleSocialLogin, isPending: isSocialLoginLoading } = useMutation({
    mutationKey: ['social-login'],
    mutationFn: async ({
      provider,
      callbackURL,
    }: {
      provider: 'github' | 'google'
      callbackURL?: string
    }) => {
      await signIn.social(
        {
          provider,
          callbackURL: callbackURL || '/workspaces',
        },
        {
          onSuccess: () => {
            router.push('/workspaces')
          },
        },
      )
    },
    onSuccess: () => {},
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const handleLogout = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push('/sign-in')
        },
      },
    })
  }

  return { handleSocialLogin, isSocialLoginLoading, handleLogout, useSession }
}
