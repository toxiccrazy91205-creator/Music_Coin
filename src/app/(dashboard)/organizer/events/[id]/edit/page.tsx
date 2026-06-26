"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { updateEventAction } from "@/features/events/events.actions"
import { getEventsAction } from "@/features/events/events.actions"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

const updateEventSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().min(10).optional(),
  venue: z.string().min(3).optional(),
  date: z.string().optional(),
  ticketPrice: z.number().positive().optional(),
})

interface UpdateEventForm {
  title?: string
  description?: string
  venue?: string
  date?: string
  ticketPrice?: number
}

export default function EditEventPage() {
  const router = useRouter()
  const params = useParams()
  const eventId = params.id as string
  const [loading, setLoading] = useState(true)
  const [serverError, setServerError] = useState("")

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateEventForm>({
    resolver: zodResolver(updateEventSchema),
  })

  interface EventData {
    id: string
    title: string
    description: string
    venue: string
    eventDate: Date | string
    ticketPrice: unknown
  }

  useEffect(() => {
    getEventsAction(undefined, true).then((res) => {
      if (res.success) {
        const events = res.data as EventData[]
        const event = events.find((e) => e.id === eventId)
        if (event) {
          reset({
            title: event.title,
            description: event.description,
            venue: event.venue,
            date: new Date(event.eventDate).toISOString().split("T")[0],
            ticketPrice: event.ticketPrice && typeof event.ticketPrice === 'object' ? (event.ticketPrice as { value: number }).value : (event.ticketPrice as number) || 0,
          })
        }
      }
      setLoading(false)
    })
  }, [eventId, reset])

  async function onSubmit(data: UpdateEventForm) {
    setServerError("")
    const result = await updateEventAction(eventId, data)
    if (result.success) {
      router.push("/organizer/events")
    } else {
      setServerError(result.error ?? "Something went wrong")
    }
  }

  if (loading) return <p className="text-muted-foreground">Loading...</p>

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Edit Event</CardTitle>
          <CardDescription>Update your event details.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {serverError && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{serverError}</div>
            )}
            <div className="space-y-2">
              <Label htmlFor="title">Event Title</Label>
              <Input id="title" {...register("title")} />
              {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" {...register("description")} />
              {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="venue">Venue</Label>
              <Input id="venue" {...register("venue")} />
              {errors.venue && <p className="text-sm text-destructive">{errors.venue.message}</p>}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input id="date" {...register("date")} type="date" />
                {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="ticketPrice">Ticket Price (MC)</Label>
                <Input id="ticketPrice" {...register("ticketPrice")} type="number" step="0.01" min="0" />
                {errors.ticketPrice && <p className="text-sm text-destructive">{errors.ticketPrice.message}</p>}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => router.push("/organizer/events")}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
