"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string
  onValueChange: (value: string) => void
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, value, onValueChange, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState(value)

    React.useEffect(() => {
      setDisplayValue(value)
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let inputValue = e.target.value
      
      // Remove tudo exceto números e vírgula
      inputValue = inputValue.replace(/[^\d,]/g, '')
      
      // Remove vírgulas extras
      const parts = inputValue.split(',')
      if (parts.length > 2) {
        inputValue = parts[0] + ',' + parts.slice(1).join('')
      }
      
      // Limita a 2 casas decimais após a vírgula
      if (parts.length === 2 && parts[1].length > 2) {
        inputValue = parts[0] + ',' + parts[1].substring(0, 2)
      }

      setDisplayValue(inputValue)
      onValueChange(inputValue)
    }

    const handleBlur = () => {
      // Formata ao perder o foco
      if (displayValue && !displayValue.includes(',')) {
        const formatted = displayValue + ',00'
        setDisplayValue(formatted)
        onValueChange(formatted)
      } else if (displayValue.endsWith(',')) {
        const formatted = displayValue + '00'
        setDisplayValue(formatted)
        onValueChange(formatted)
      } else if (displayValue.includes(',')) {
        const parts = displayValue.split(',')
        if (parts[1].length === 1) {
          const formatted = parts[0] + ',' + parts[1] + '0'
          setDisplayValue(formatted)
          onValueChange(formatted)
        }
      }
    }

    return (
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
          R$
        </span>
        <input
          type="text"
          inputMode="decimal"
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          ref={ref}
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="0,00"
          {...props}
        />
      </div>
    )
  }
)
CurrencyInput.displayName = "CurrencyInput"

export { CurrencyInput }
