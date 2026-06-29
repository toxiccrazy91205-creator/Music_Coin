"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useAuth } from "@/context"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { UserRole, ROLE_LABELS, ROLE_DESCRIPTIONS } from "@/types"
import { registerSchema, type RegisterInput } from "@/lib/auth/validation"
import { auth } from "@/lib/firebase/client"
import { createUserWithEmailAndPassword } from "firebase/auth"

const REGISTER_ROLES = [UserRole.FAN, UserRole.ARTIST, UserRole.PRODUCTION_HOUSE, UserRole.ORGANIZER]

export default function RegisterPage() {
  const router = useRouter()
  const { register: registerUser, globalIsDemo: isDemo, setGlobalIsDemo: setIsDemo } = useAuth()
  const [serverError, setServerError] = useState("")
  const [successMsg, setSuccessMsg] = useState("")
  const [requiresOtp, setRequiresOtp] = useState(false)
  const [otpCode, setOtpCode] = useState("")
  const [registeredEmail, setRegisteredEmail] = useState("")
  const [resendTimer, setResendTimer] = useState(60)

  // Redirect if already logged in (handles browser back button scenarios)
  const { user, loading } = useAuth()
  useEffect(() => {
    if (!loading && user && user.role) {
      const dashboardRoutes: Record<string, string> = {
        ADMIN: "/admin",
        ORGANIZER: "/organizer",
        ARTIST: "/artist/dashboard",
        FAN: "/fan/dashboard",
        PRODUCTION_HOUSE: "/production-house",
      }
      router.replace(dashboardRoutes[user.role] ?? "/")
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
    control,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", role: UserRole.FAN },
  })

  async function onSubmit(data: RegisterInput) {
    setServerError("")
    setSuccessMsg("")
    try {
      if (isDemo) {
        const result = await registerUser({ name: data.name, email: data.email, password: data.password, role: data.role, isDemo: true })
        if (result.success) {
          router.push("/")
        } else {
          setServerError(result.error ?? "Registration failed")
        }
      } else {
        // Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password)
        const idToken = await userCredential.user.getIdToken()
        
        const result = await registerUser({ 
          name: data.name, 
          email: data.email, 
          role: data.role,
          firebaseIdToken: idToken,
          isDemo: false
        })
        
        if (result.success) {
          // Immediately sign out so they don't have an active unverified session on the client
          await auth.signOut()
          
          // Trigger OTP generation backend
          await fetch("/api/auth/send-otp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: data.email })
          })

          setRegisteredEmail(data.email)
          setRequiresOtp(true)
          setResendTimer(60)
        } else {
          setServerError(result.error ?? "Registration failed")
        }
      }
    } catch (error: any) {
      setServerError(error.message || "An error occurred during registration")
    }
  }

  async function handleVerifyOtp() {
    setServerError("")
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: registeredEmail, code: otpCode })
      })
      const data = await res.json()
      if (data.success) {
        setRequiresOtp(false)
        setSuccessMsg("Email verified successfully! You can now log in.")
      } else {
        setServerError(data.error || "Invalid OTP code.")
      }
    } catch (e: any) {
      setServerError("Failed to verify OTP.")
    }
  }

  async function resendVerification() {
    if (registeredEmail) {
      setServerError("")
      try {
        await fetch("/api/auth/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: registeredEmail })
        })
        setServerError("New OTP sent to your email!")
        setResendTimer(60)
      } catch (e: any) {
        setServerError("Failed to send OTP.")
      }
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

  if (successMsg) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Verification Complete</CardTitle>
          <CardDescription>Your email has been successfully verified.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-primary/10 p-4 text-sm text-primary mb-4">{successMsg}</div>
        </CardContent>
        <CardFooter>
          <Button onClick={() => router.push("/login")} className="w-full">
            Go to Login
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          Create an account
          <Button type="button" variant="outline" size="sm" onClick={() => setIsDemo(!isDemo)}>
            {isDemo ? "Switch to Real Mode" : "Switch to Demo Mode"}
          </Button>
        </CardTitle>
        <CardDescription>
          {isDemo 
            ? "Demo Mode: Seed data into your local database." 
            : "Real Mode: Securely register using Firebase Authentication."}
        </CardDescription>
      </CardHeader>
      {isDemo ? (
        <CardContent className="pt-6 pb-8 text-center space-y-4">
          <div className="rounded-lg bg-primary/10 p-4 text-sm text-primary inline-block">
            Sign up is disabled in Demo Mode.
          </div>
          <p className="text-sm text-muted-foreground">
            Please switch to Real Mode to create a new account, or go to Login to use seeded Demo accounts.
          </p>
          <div className="pt-4">
            <Button variant="outline" onClick={() => router.push("/login")} className="w-full">
              Go to Login
            </Button>
          </div>
        </CardContent>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {serverError && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{serverError}</div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" placeholder="Your name" {...register("name")} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" {...register("email")} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="at least 8 characters" {...register("password")} />
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">I am a...</Label>
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full" id="role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REGISTER_ROLES.map((r) => (
                        <SelectItem key={r} value={r}>
                          <span className="font-medium">{ROLE_LABELS[r]}</span>
                          <span className="text-muted-foreground"> — {ROLE_DESCRIPTIONS[r]}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.role && <p className="text-sm text-destructive">{errors.role.message}</p>}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Creating account..." : "Secure Sign Up"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      )}
    </Card>
  )
}
