"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useAuth } from "@/context"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { loginSchema, type LoginInput } from "@/lib/auth/validation"
import { auth } from "@/lib/firebase/client"
import { signInWithEmailAndPassword } from "firebase/auth"

const DEMO_CREDENTIALS = [
  { role: "Admin", email: "admin@musiccoin.festival", password: "Admin@123" },
  { role: "Organizer", email: "organizer@musiccoin.festival", password: "Organizer@123" },
  { role: "Artist", email: "artist@musiccoin.festival", password: "Artist@123" },
  { role: "Fan", email: "fan@musiccoin.festival", password: "Fan@123" },
  { role: "Prod. House", email: "production@musiccoin.festival", password: "Production@123" },
] as const

const ROLE_ROUTES: Record<string, string> = {
  ADMIN: "/admin",
  ORGANIZER: "/organizer",
  ARTIST: "/artist/dashboard",
  FAN: "/fan/dashboard",
  PRODUCTION_HOUSE: "/production-house",
}

export default function LoginPage() {
  const router = useRouter()
  const { login, globalIsDemo: isDemo, setGlobalIsDemo: setIsDemo } = useAuth()
  const [serverError, setServerError] = useState("")
  const [unverifiedUser, setUnverifiedUser] = useState<any>(null)
  const [requiresOtp, setRequiresOtp] = useState(false)
  const [otpCode, setOtpCode] = useState("")
  const [resendTimer, setResendTimer] = useState(60)

  // Redirect if already logged in (handles browser back button scenarios)
  const { user, loading } = useAuth()
  useEffect(() => {
    if (!loading && user && user.role) {
      router.replace(ROLE_ROUTES[user.role] ?? "/")
    }
  }, [user, loading, router])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (requiresOtp && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [requiresOtp, resendTimer])

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  async function onSubmit(data: LoginInput) {
    setServerError("")
    try {
      if (isDemo) {
        const result = await login({ email: data.email, password: data.password, isDemo: true })
        if (result.success) {
          router.push(ROLE_ROUTES[result.role!] ?? "/")
        } else {
          setServerError(result.error ?? "Invalid demo credentials")
        }
      } else {
        // Firebase Auth
        const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password)
        
        if (!userCredential.user.emailVerified) {
          setUnverifiedUser(userCredential.user)
          await auth.signOut()
          
          // Trigger OTP since they are unverified
          await fetch("/api/auth/send-otp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: data.email })
          })

          setRequiresOtp(true)
          setResendTimer(60)
          setServerError("Your email is not verified. Enter the OTP code sent to your email.")
          return
        }

        const idToken = await userCredential.user.getIdToken()
        const result = await login({ firebaseIdToken: idToken, isDemo: false })
        if (result.success) {
          router.push(ROLE_ROUTES[result.role!] ?? "/")
        } else {
          setServerError(result.error ?? "Authentication failed")
        }
      }
    } catch (error: any) {
      setServerError(error.message || "An error occurred during login")
    }
  }

  async function resendVerification() {
    if (unverifiedUser) {
      setServerError("")
      try {
        await fetch("/api/auth/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: unverifiedUser.email })
        })
        setServerError("New OTP sent to your email!")
        setResendTimer(60)
      } catch (e: any) {
        setServerError("Failed to send OTP.")
      }
    }
  }

  async function handleVerifyOtp() {
    setServerError("")
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: unverifiedUser.email, code: otpCode })
      })
      const data = await res.json()
      if (data.success) {
        setRequiresOtp(false)
        setServerError("")
        alert("Verified successfully! You can now log in.")
        setUnverifiedUser(null)
      } else {
        setServerError(data.error || "Invalid OTP code.")
      }
    } catch (e: any) {
      setServerError("Failed to verify OTP.")
    }
  }

  if (requiresOtp) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Verify Your Email</CardTitle>
          <CardDescription>Enter the 6-digit OTP code sent to your email.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {serverError && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{serverError}</div>}
          <div className="space-y-2">
            <Label htmlFor="otp">6-Digit Code</Label>
            <Input id="otp" placeholder="123456" maxLength={6} value={otpCode} onChange={(e) => setOtpCode(e.target.value)} />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button onClick={handleVerifyOtp} className="w-full" disabled={otpCode.length < 6}>
            Verify Code
          </Button>
          <Button variant="outline" onClick={resendVerification} className="w-full" disabled={resendTimer > 0}>
            {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : "Resend OTP"}
          </Button>
        </CardFooter>
      </Card>
    )
  }

  function fillDemoCredentials(email: string, password: string) {
    setValue("email", email)
    setValue("password", password)
    setServerError("")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          Sign in
          <Button variant="outline" size="sm" onClick={() => setIsDemo(!isDemo)}>
            {isDemo ? "Switch to Real Mode" : "Switch to Demo Mode"}
          </Button>
        </CardTitle>
        <CardDescription>
          {isDemo 
            ? "Demo Mode: Use seeded accounts to explore the app." 
            : "Real Mode: Login securely using Firebase Authentication."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isDemo && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Demo quick login</p>
            <div className="flex flex-wrap gap-1.5">
              {DEMO_CREDENTIALS.map((cred) => (
                <Button
                  key={cred.role}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  disabled={isSubmitting}
                  onClick={() => fillDemoCredentials(cred.email, cred.password)}
                >
                  {cred.role}
                </Button>
              ))}
            </div>
            <div className="relative pt-4">
              <div className="absolute inset-0 flex items-center pt-4">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase pt-4">
                <span className="bg-card px-2 text-muted-foreground">or</span>
              </div>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {serverError && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive flex flex-col gap-2">
              <span>{serverError}</span>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" {...register("email")} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              {!isDemo && (
                <Link href="/forgot-password" className="text-xs font-medium text-primary hover:underline">
                  Forgot password?
                </Link>
              )}
            </div>
            <Input id="password" type="password" placeholder="••••••••" {...register("password")} />
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : (isDemo ? "Sign in (Demo)" : "Sign in securely")}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col gap-3 pt-0">
        {!isDemo ? (
          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-medium text-primary hover:underline">
              Sign up
            </Link>
          </p>
        ) : (
          <p className="text-center text-sm text-muted-foreground">
            Registration is disabled in Demo Mode.
          </p>
        )}
      </CardFooter>
    </Card>
  )
}
