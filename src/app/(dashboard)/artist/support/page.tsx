"use client"

import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Heart, Scale, BookOpen, Phone, FileText, ArrowRight, Users } from "lucide-react"
import Link from "next/link"

export default function ArtistSupportPage() {
  const { user } = useAuth()

  if (!user || user.role !== "ARTIST") return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Support & Resources Hub</h1>
          <p className="text-muted-foreground mt-1">Access mental health resources and standardized legal contract templates.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Mental Health Section */}
        <Card className="border-t-4 border-t-pink-500 shadow-md">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-pink-100 dark:bg-pink-900/30 text-pink-600 rounded-md">
                <Heart className="h-5 w-5" />
              </div>
              <CardTitle>Mental Health & Wellbeing</CardTitle>
            </div>
            <CardDescription>
              The music industry can be overwhelming. We've partnered with top mental health professionals to provide free and subsidized support for our artists.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-semibold flex items-center gap-2 text-sm"><Phone className="h-4 w-4" /> 24/7 Crisis Hotline</h4>
              <p className="text-sm text-muted-foreground mt-1">Immediate, confidential support for artists experiencing anxiety, burnout, or crisis.</p>
              <Button className="mt-3 w-full" variant="secondary">Call Now (Anonymous)</Button>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-auto flex-col py-4 gap-2 justify-center text-center whitespace-normal">
                <BookOpen className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">Therapy Vouchers</span>
              </Button>
              <Button variant="outline" className="h-auto flex-col py-4 gap-2 justify-center text-center whitespace-normal">
                <Users className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">Support Groups</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Legal & Contracts Section */}
        <Card className="border-t-4 border-t-blue-500 shadow-md">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-md">
                <Scale className="h-5 w-5" />
              </div>
              <CardTitle>Legal & Contracts Hub</CardTitle>
            </div>
            <CardDescription>
              Don't sign away your rights. Use our standardized, artist-friendly contract templates for your gigs, splits, and collaborations.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {[
                { name: "Standard Royalty Split Agreement", desc: "Fair-use template for collaborations." },
                { name: "Live Performance Contract", desc: "Protects you from predatory venue fees." },
                { name: "Non-Disclosure Agreement (NDA)", desc: "For unreleased stems and tracks." }
              ].map((doc, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-md border bg-card hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <h4 className="text-sm font-medium">{doc.name}</h4>
                      <p className="text-xs text-muted-foreground">{doc.desc}</p>
                    </div>
                  </div>
                  <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="pt-2">
              <Link href="#" className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium">
                Connect with an Entertainment Lawyer &rarr;
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
