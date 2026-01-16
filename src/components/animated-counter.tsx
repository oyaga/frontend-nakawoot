'use client'

import { motion, useSpring, useTransform, useMotionValue } from 'framer-motion'
import { useEffect } from 'react'

interface AnimatedCounterProps {
  value: number | string
  className?: string
  prefix?: string
  suffix?: string
}

export function AnimatedCounter({ value, className, prefix = '', suffix = '' }: AnimatedCounterProps) {
  // If value is a string that might contain non-numeric chars (like "12m 30s"), 
  // we can't easily animate it directly without parsing.
  // For simple numbers or formatted numbers, we can strip non-numeric and animate.
  
  // Try to extract the numeric part if beneficial, but for "12m 30s" it handles multiple values.
  // For simplicity, if it's not a number, we just render it (or try to animate simple cases).
  // The requirement is specific to dashboard stats: total_inboxes (number), total_conversations (number), average_response_time (string duration)
  
  // For pure numbers
  if (typeof value === 'number') {
    return <CounterNumber value={value} className={className} prefix={prefix} suffix={suffix} />
  }

  // If it's a string, check if it's purely numeric (maybe with commas/dots)
  const cleanValue = value.replace(/[^0-9.]/g, '')
  if (!isNaN(Number(cleanValue)) && cleanValue !== '') {
     // If it's something like "1.200", we can animate it.
     // But average_response_time is "12m 23s", difficult to animate smoothly as a single number.
     // So we just render strings normally for now to avoid complexity, 
     // OR we can just animate opacity/y position on change.
     // Let's implement a visual "slide up/down" for strings to show change without full refresh feel.
     return <AnimatedValue value={value} className={className} />
  }

  return <AnimatedValue value={value} className={className} />
}

function CounterNumber({ value, className, prefix, suffix }: { value: number, className?: string, prefix: string, suffix: string }) {
  const motionValue = useMotionValue(value)
  const springValue = useSpring(motionValue, { damping: 50, stiffness: 400 })
  const displayValue = useTransform(springValue, (latest) => {
      // Format number with locale if needed, for now simple integer
      return `${prefix}${Math.round(latest).toLocaleString('pt-BR')}${suffix}`
  })

  useEffect(() => {
    motionValue.set(value)
  }, [value, motionValue])

  return <motion.span className={className}>{displayValue}</motion.span>
}

function AnimatedValue({ value, className }: { value: string, className?: string }) {
  // Animate opacity/y when value changes
  return (
    <motion.div
        key={value}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={className}
    >
      {value}
    </motion.div>
  )
}
