'use client'

import { Icon } from '@/components/icon'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'

type AuthCardProps = {
  children: React.ReactNode
  variant?: 'login' | 'register'
} & React.ComponentPropsWithoutRef<'div'>

export const AuthCard = ({ children, className, variant = 'login', ...props }: AuthCardProps) => {
  const { handleSocialLogin, isSocialLoginLoading } = useAuth()

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">
            {variant === 'login' ? 'Welcome back' : 'Create an account'}
          </CardTitle>
          <CardDescription>
            {variant === 'login' ? 'Login with your account' : 'Create an account to get started'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div className="flex flex-col gap-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleSocialLogin({ provider: 'github' })}
                disabled={isSocialLoginLoading}
              >
                <Icon name="mdi--github" className="mr-2 size-4" />
                Login with Github
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleSocialLogin({ provider: 'google' })}
                disabled={isSocialLoginLoading}
              >
                <Icon name="mdi--google" className="mr-2 size-4" />
                Login with Google
              </Button>
            </div>
            <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
              <span className="relative z-10 bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
            {children}
          </div>
        </CardContent>
      </Card>
      <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-primary">
        By clicking continue, you agree to our <a href="#">Terms of Service</a> and{' '}
        <a href="#">Privacy Policy</a>.
      </div>
    </div>
  )
}
