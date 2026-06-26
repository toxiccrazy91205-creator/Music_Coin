"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { createEventAction } from "@/features/events/events.actions"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

const createEventSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  venue: z.string().min(3, "Venue is required"),
  eventDate: z.string().min(1, "Date is required"),
  ticketPrice: z.coerce.number().positive("Price must be positive"),
  capacity: z.coerce.number().optional(),
  sponsors: z.string().optional(),
  artists: z.string().optional(),
})

type CreateEventForm = z.infer<typeof createEventSchema>

export default function CreateEventPage() {
  const router = useRouter()
  const [serverError, setServerError] = useState("")

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(createEventSchema),
    defaultValues: { title: "", description: "", venue: "", eventDate: "", ticketPrice: 0, capacity: 0, sponsors: "", artists: "" } as any,
  })

  async function onSubmit(data: CreateEventForm) {
    setServerError("")
    const payload = {
      ...data,
      sponsors: data.sponsors ? data.sponsors.split(",").map(s => s.trim()) : [],
      artists: data.artists ? data.artists.split(",").map(s => s.trim()) : [],
    }
    const result = await createEventAction(payload)
    if (result.success) {
      router.push("/organizer/events")
    } else {
      setServerError(result.error ?? "Something went wrong")
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Create Event</CardTitle>
          <CardDescription>Set up a new festival event. It will be saved as a draft.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {serverError && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{serverError}</div>
            )}
            <div className="space-y-2">
              <Label htmlFor="title">Event Title</Label>
              <Input id="title" {...register("title")} placeholder="Summer Music Festival 2026" />
              {errors.title && <p className="text-sm text-destructive">{String(errors.title.message)}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" {...register("description")} placeholder="A brief description of the event" />
              {errors.description && <p className="text-sm text-destructive">{String(errors.description.message)}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="venue">Venue</Label>
              <Input id="venue" {...register("venue")} placeholder="City Park Arena" />
              {errors.venue && <p className="text-sm text-destructive">{String(errors.venue.message)}</p>}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="eventDate">Date</Label>
                <Input id="eventDate" {...register("eventDate")} type="date" />
                {errors.eventDate && <p className="text-sm text-destructive">{String(errors.eventDate.message)}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="ticketPrice">Ticket Price (MC)</Label>
                <Input id="ticketPrice" {...register("ticketPrice")} type="number" step="0.01" min="0" />
                {errors.ticketPrice && <p className="text-sm text-destructive">{String(errors.ticketPrice.message)}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity (Optional)</Label>
                <Input id="capacity" {...register("capacity")} type="number" />
                {errors.capacity && <p className="text-sm text-destructive">{String(errors.capacity.message)}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="artists">Artists (Comma separated IDs or names)</Label>
              <Input id="artists" {...register("artists")} placeholder="Artist1, Artist2" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sponsors">Sponsors (Comma separated)</Label>
              <Input id="sponsors" {...register("sponsors")} placeholder="Sponsor A, Sponsor B" />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => router.push("/organizer/events")}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Event"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
