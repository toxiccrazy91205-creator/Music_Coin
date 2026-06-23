"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { Controller, FormProvider, useFormContext } from "react-hook-form"
import { cn } from "@/lib/utils"

const Form = FormProvider

type FormFieldContextValue = {
  name: string
}

const FormFieldContext = React.createContext<FormFieldContextValue>({} as FormFieldContextValue)

const FormField = ({ ...props }: { name: string; children: React.ReactNode }) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props as any} />
    </FormFieldContext.Provider>
  )
}

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext)
  const formContext = useFormContext()
  if (!formContext) throw new Error("useFormField must be used within <Form>")
  const fieldState = formContext.getFieldState(fieldContext.name)
  return { ...fieldContext, ...fieldState, formItemId: `${fieldContext.name}-id` }
}

const FormItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} className={cn("space-y-2", className)} {...props} />
  }
)
FormItem.displayName = "FormItem"

const FormLabel = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => {
    const { formItemId } = useFormField()
    return <label ref={ref} className={cn("text-sm font-medium", className)} htmlFor={formItemId} {...props} />
  }
)
FormLabel.displayName = "FormLabel"

const FormMessage = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, children, ...props }, ref) => {
    const { error } = useFormField()
    const body = error ? String(error.message) : children
    if (!body) return null
    return (
      <p ref={ref} className={cn("text-sm text-destructive", className)} {...props}>
        {body}
      </p>
    )
  }
)
FormMessage.displayName = "FormMessage"

export { useFormField, Form, FormItem, FormLabel, FormMessage, FormField }
