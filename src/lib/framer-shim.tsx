'use client'

import React, { useState, useEffect, useRef, forwardRef } from 'react'

// ========================================
// Framer Motion CSS-based Shim
// Replaces framer-motion to avoid Turbopack HMR crashes
// ========================================

interface MotionProps extends React.HTMLAttributes<HTMLElement> {
  initial?: Record<string, any>
  animate?: Record<string, any>
  exit?: Record<string, any>
  transition?: Record<string, any>
  whileHover?: Record<string, any>
  whileTap?: Record<string, any>
  whileFocus?: Record<string, any>
  whileDrag?: Record<string, any>
  whileInView?: Record<string, any>
  variants?: Record<string, Record<string, any>>
  viewport?: Record<string, any>
  drag?: boolean | string
  dragConstraints?: any
  dragElastic?: number
  dragMomentum?: boolean
  layout?: boolean | string
  layoutId?: string
  layoutDependency?: any
  layoutScroll?: boolean
  layoutRoot?: boolean
  onLayoutAnimationStart?: () => void
  onLayoutAnimationComplete?: () => void
  onAnimationStart?: () => void
  onAnimationComplete?: () => void
  onUpdate?: (latest: any) => void
  onHoverStart?: () => void
  onHoverEnd?: () => void
  onTapStart?: () => void
  onTap?: () => void
  onTapCancel?: () => void
  onDragStart?: () => void
  onDrag?: () => void
  onDragEnd?: () => void
  custom?: any
  inherit?: boolean
  style?: React.CSSProperties
  children?: React.ReactNode
  key?: string | number
}

function motionToCSS(values: Record<string, any>): React.CSSProperties {
  const style: React.CSSProperties = {}
  const transforms: string[] = []

  if ('opacity' in values) style.opacity = values.opacity
  if ('scale' in values) transforms.push(`scale(${values.scale})`)
  if ('scaleX' in values) transforms.push(`scaleX(${values.scaleX})`)
  if ('scaleY' in values) transforms.push(`scaleY(${values.scaleY})`)
  if ('rotate' in values) transforms.push(`rotate(${values.rotate}deg)`)
  if ('x' in values) transforms.push(`translateX(${values.x}px)`)
  if ('y' in values) transforms.push(`translateY(${values.y}px)`)
  if ('borderRadius' in values) style.borderRadius = values.borderRadius
  if ('boxShadow' in values) style.boxShadow = values.boxShadow
  if ('filter' in values) style.filter = values.filter
  if ('width' in values) style.width = values.width
  if ('height' in values) style.height = values.height
  if ('backgroundColor' in values) style.backgroundColor = values.backgroundColor
  if ('borderColor' in values) style.borderColor = values.borderColor
  if ('color' in values) style.color = values.color
  if ('gap' in values) style.gap = values.gap
  if ('padding' in values) style.padding = values.padding
  if ('margin' in values) style.margin = values.margin
  if ('flex' in values) style.flex = values.flex

  if (transforms.length > 0) {
    style.transform = transforms.join(' ')
  }

  return style
}

function getTransitionCSS(transition?: Record<string, any>): string {
  if (!transition) return 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'

  const duration = transition.duration ?? 0.2
  const ease = transition.ease ?? 'cubic-bezier(0.4, 0, 0.2, 1)'

  if (transition.type === 'spring') {
    const damping = transition.damping ?? 20
    const stiffness = transition.stiffness ?? 300
    // Approximate spring with CSS
    const dur = (damping / stiffness) * 1.5
    return `all ${dur}s cubic-bezier(0.34, 1.56, 0.64, 1)`
  }

  if (transition.type === 'tween' || transition.type === 'inertial') {
    return `all ${duration}s ${ease}`
  }

  return `all ${duration}s ${ease}`
}

function createMotionComponent(tag: string) {
  const Component = forwardRef<HTMLElement, MotionProps>((props, ref) => {
    const {
      initial, animate, exit, transition, whileHover, whileTap, whileFocus,
      variants, layout, layoutId, custom, inherit, drag, dragConstraints,
      dragElastic, dragMomentum, viewport, whileInView, onAnimationComplete,
      onHoverStart, onHoverEnd, onTap, onTapStart, onTapCancel, style,
      children, className, onClick, ...rest
    } = props

    const [isHovered, setIsHovered] = useState(false)
    const [isPressed, setIsPressed] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
      requestAnimationFrame(() => setMounted(true))
    }, [])

    // Resolve variants
    const resolveVariant = (v: string | Record<string, any> | undefined): Record<string, any> | undefined => {
      if (!v) return undefined
      if (typeof v === 'string' && variants) return variants[v]
      return v as Record<string, any>
    }

    const initialState = resolveVariant(initial as string) || (initial as Record<string, any>)
    const animateState = resolveVariant(animate as string) || (animate as Record<string, any>)

    // Build current style
    let currentStyle: React.CSSProperties = {}

    // Start with initial state
    if (initialState) {
      Object.assign(currentStyle, motionToCSS(initialState))
    }

    // Apply animate state if mounted
    if (mounted && animateState) {
      Object.assign(currentStyle, motionToCSS(animateState))
    }

    // Apply whileHover
    if (isHovered && whileHover) {
      Object.assign(currentStyle, motionToCSS(whileHover))
    }

    // Apply whileTap
    if (isPressed && whileTap) {
      Object.assign(currentStyle, motionToCSS(whileTap))
    }

    // Add transition
    const transitionCSS = getTransitionCSS(transition)
    currentStyle.transition = transitionCSS

    // Merge with explicit style (explicit wins)
    if (style) {
      Object.assign(currentStyle, style)
    }

    const Tag = tag as any

    return (
      <Tag
        ref={ref}
        className={className}
        style={currentStyle}
        onClick={onClick}
        onMouseEnter={(e: any) => {
          setIsHovered(true)
          onHoverStart?.()
          ;(props as any).onMouseEnter?.(e)
        }}
        onMouseLeave={(e: any) => {
          setIsHovered(false)
          setIsPressed(false)
          onHoverEnd?.()
          ;(props as any).onMouseLeave?.(e)
        }}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onTouchStart={() => setIsPressed(true)}
        onTouchEnd={() => setIsPressed(false)}
        {...rest}
      >
        {children}
      </Tag>
    )
  })

  Component.displayName = `motion.${tag}`
  return Component
}

// Create motion components for common HTML elements
const motionCache: Record<string, any> = {}

export const motion = new Proxy({} as Record<string, any>, {
  get(target, prop: string) {
    if (!motionCache[prop]) {
      motionCache[prop] = createMotionComponent(prop)
    }
    return motionCache[prop]
  },
})

// AnimatePresence - simplified to just render children
export function AnimatePresence({
  children,
  mode,
}: {
  children: React.ReactNode
  mode?: string
  onExitComplete?: () => void
  initial?: boolean
  custom?: any
}) {
  return <>{children}</>
}

// useMotionValue shim
export function useMotionValue(initial: number) {
  const [value, setValue] = useState(initial)
  return {
    get: () => value,
    set: (v: number) => setValue(v),
    setWithVelocity: (v: number) => setValue(v),
  }
}

// useTransform shim
export function useTransform(
  motionValue: any,
  inputOrTransform: number[] | ((v: number) => any),
  output?: any[]
) {
  const val = typeof motionValue === 'object' && motionValue.get ? motionValue.get() : motionValue
  if (typeof inputOrTransform === 'function') {
    return inputOrTransform(val)
  }
  // Input/output range interpolation - simplified
  return val
}

// useAnimation shim
export function useAnimation() {
  return {
    start: (variant: any) => Promise.resolve(),
    set: (variant: any) => {},
    stop: () => {},
  }
}

// useInView shim
export function useInView(ref: any, options?: any) {
  return true
}

// useScroll shim
export function useScroll(options?: any) {
  return {
    scrollY: { get: () => 0, set: () => {} },
    scrollX: { get: () => 0, set: () => {} },
    scrollYProgress: { get: () => 0, set: () => {} },
    scrollXProgress: { get: () => 0, set: () => {} },
  }
}

// useMotionValueEvent shim
export function useMotionValueEvent(value: any, event: string, callback: (v: any) => void) {
  // No-op
}

// useDragControls shim
export function useDragControls() {
  return {
    start: () => {},
    stop: () => {},
  }
}

// useReducedMotion shim
export function useReducedMotion() {
  return false
}

export default motion
