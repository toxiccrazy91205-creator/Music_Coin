"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

import { useAuth } from "@/context"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const { globalIsDemo: isDemo, setGlobalIsDemo: setIsDemo } = useAuth()
  const [email, setEmail] = useState("")
  const [otpCode, setOtpCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [step, setStep] = useState<"request" | "verify">("request")
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState("")
  const [successMsg, setSuccessMsg] = useState("")
  const [resendTimer, setResendTimer] = useState(60)

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (step === "verify" && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [step, resendTimer])

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault()
    setServerError("")
    setLoading(true)
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      })
      const data = await res.json()
      if (data.success) {
        setStep("verify")
        setResendTimer(60)
        if (e.type !== "submit") {
          setServerError("New OTP sent to your email!")
        }
      } else {
        setServerError(data.error || "Failed to send OTP.")
      }
    } catch (error) {
      setServerError("An error occurred.")
    } finally {
      setLoading(false)
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    setServerError("")
    setLoading(true)
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: otpCode, newPassword, isDemo })
      })
      const data = await res.json()
      if (data.success) {
        setSuccessMsg("Password reset successfully! You can now log in.")
      } else {
        setServerError(data.error || "Invalid OTP code.")
      }
    } catch (error) {
      setServerError("Failed to reset password.")
    } finally {
      setLoading(false)
    }
  }

  if (successMsg) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Password Reset</CardTitle>
          <CardDescription>Your password has been successfully updated.</CardDescription>
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

  if (step === "verify") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Enter Reset Code</CardTitle>
          <CardDescription>We've sent a 6-digit code to {email}. Enter it below along with your new password.</CardDescription>
        </CardHeader>
        <form onSubmit={handleResetPassword}>
          <CardContent className="space-y-4">
            {serverError && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{serverError}</div>}
            <div className="space-y-2">
              <Label htmlFor="otp">6-Digit Code</Label>
              <Input id="otp" required placeholder="123456" maxLength={6} value={otpCode} onChange={(e) => setOtpCode(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input id="password" type="password" required placeholder="At least 8 characters" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={loading || otpCode.length < 6 || newPassword.length < 8}>
              {loading ? "Resetting..." : "Reset Password"}
            </Button>
            <Button type="button" variant="outline" className="w-full" disabled={resendTimer > 0} onClick={(e) => handleSendOtp(e)}>
              {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : "Resend OTP"}
            </Button>
            <Button type="button" variant="ghost" className="w-full" onClick={() => setStep("request")}>
              Back
            </Button>
          </CardFooter>
        </form>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          Reset Password
          <Button type="button" variant="outline" size="sm" onClick={() => setIsDemo(!isDemo)}>
            {isDemo ? "Switch to Real Mode" : "Switch to Demo Mode"}
          </Button>
        </CardTitle>
        <CardDescription>
          {isDemo ? "Demo Mode: Reset your local database password." : "Real Mode: Reset your Firebase password safely."}
        </CardDescription>
      </CardHeader>
      {isDemo ? (
        <CardContent className="pt-6 pb-8 text-center space-y-4">
          <div className="rounded-lg bg-primary/10 p-4 text-sm text-primary inline-block">
            Password reset is disabled in Demo Mode.
          </div>
          <p className="text-sm text-muted-foreground">
            Please switch to Real Mode to reset your Firebase password.
          </p>
          <div className="pt-4">
            <Button variant="outline" onClick={() => router.push("/login")} className="w-full">
              Go to Login
            </Button>
          </div>
        </CardContent>
      ) : (
        <form onSubmit={handleSendOtp}>
          <CardContent className="space-y-4">
            {serverError && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{serverError}</div>}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={loading || !email}>
              {loading ? "Sending..." : "Send OTP"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Remembered your password?{" "}
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
