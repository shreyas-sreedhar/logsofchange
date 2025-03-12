"use client"

import { Github } from "lucide-react"
import { useEffect, useRef, useState } from "react"

interface PremiumButtonProps {
  onClick: () => void
  text?: string
}

export default function PremiumButton({ onClick, text = "Sign in with GitHub" }: PremiumButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [isPressed, setIsPressed] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)
  const [hasClicked, setHasClicked] = useState(false)

  // Handle mouse movement for interactive effects
  useEffect(() => {
    const button = buttonRef.current
    if (!button) return

    const handleMouseMove = (e: MouseEvent) => {
      const rect = button.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      setMousePosition({ x, y })

      // Update CSS variables for gradient effects
      button.style.setProperty("--mouse-x", `${x}px`)
      button.style.setProperty("--mouse-y", `${y}px`)
      button.style.setProperty("--mouse-percent-x", `${(x / rect.width) * 100}%`)
      button.style.setProperty("--mouse-percent-y", `${(y / rect.height) * 100}%`)
    }

    button.addEventListener("mousemove", handleMouseMove)
    return () => {
      button.removeEventListener("mousemove", handleMouseMove)
    }
  }, [])

  // Handle click effect
  const handleClick = () => {
    setIsPressed(true)
    setHasClicked(true)

    // Reset press state after animation
    setTimeout(() => setIsPressed(false), 300)

    // Reset click animation after delay
    setTimeout(() => setHasClicked(false), 2000)

    // Call the provided onClick handler
    onClick()
  }

  return (
    <div
      className={`
        relative 
        perspective-[1200px] 
        transition-transform duration-700
        ${isHovered ? "scale-105" : "scale-100"}
      `}
    >
      <button
        ref={buttonRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false)
          setIsPressed(false)
        }}
        onClick={handleClick}
        className={`
          group
          relative
          flex items-center gap-4
          px-8 py-4
          bg-neutral-900
          rounded-none
          transition-all duration-500
          ease-out
          border border-neutral-800
          backdrop-blur-sm
          shadow-[0_0_20px_rgba(139,92,246,0.3)]
          hover:shadow-[0_0_40px_rgba(139,92,246,0.5)]
          overflow-hidden
          z-10
          ${isPressed ? "transform scale-[0.98] shadow-[0_0_10px_rgba(139,92,246,0.2)]" : ""}
          ${hasClicked ? "after:animate-ripple" : ""}
          after:content-['']
          after:absolute
          after:w-[300%]
          after:h-[300%]
          after:bg-purple-500/10
          after:rounded-full
          after:top-[var(--mouse-percent-y)]
          after:left-[var(--mouse-percent-x)]
          after:opacity-0
          after:transform
          after:translate-x-[-50%]
          after:translate-y-[-50%]
          after:pointer-events-none
        `}
      >
        {/* Noise texture overlay */}
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.07] mix-blend-overlay pointer-events-none"></div>

        {/* Gradient overlay */}
        <div
          className={`
            absolute inset-0 
            bg-gradient-to-br from-purple-900/5 via-transparent to-indigo-900/10
            transition-opacity duration-700
            ${isHovered ? "opacity-100" : "opacity-0"}
          `}
        ></div>

        {/* Interactive highlight based on mouse position */}
        <div
          className={`
            absolute inset-0 
            bg-[radial-gradient(circle_at_var(--mouse-x)_var(--mouse-y),rgba(139,92,246,0.15)_0%,transparent_40%)]
            transition-opacity duration-300
            ${isHovered ? "opacity-100" : "opacity-0"}
          `}
          style={{
            transform: isHovered
              ? `translate(${(mousePosition.x - (buttonRef.current?.offsetWidth || 0) / 2) * 0.02}px, ${(mousePosition.y - (buttonRef.current?.offsetHeight || 0) / 2) * 0.02}px)`
              : "translate(0, 0)",
          }}
        ></div>

        {/* Premium shine effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -inset-full top-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500/20 to-transparent opacity-0 group-hover:opacity-100 animate-shine-slow"></div>
          <div className="absolute -inset-full top-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 animate-shine-slow animation-delay-500"></div>
          <div className="absolute left-0 -inset-full w-[1px] bg-gradient-to-b from-transparent via-purple-500/20 to-transparent opacity-0 group-hover:opacity-100 animate-shine-vertical animation-delay-300"></div>
          <div className="absolute left-full -inset-full w-[1px] bg-gradient-to-b from-transparent via-purple-500/20 to-transparent opacity-0 group-hover:opacity-100 animate-shine-vertical animation-delay-800"></div>
        </div>

        {/* Button content with subtle animations */}
        <div
          className={`
            relative flex items-center gap-3 z-10
            transition-transform duration-500
            ${isPressed ? "scale-[0.98]" : "scale-100"}
          `}
        >
          <Github
            className={`
              w-5 h-5 text-white 
              transition-all duration-500
              ${isHovered ? "animate-subtle-bounce" : ""}
            `}
            strokeWidth={2}
          />
          <span
            className={`
              text-white font-medium text-lg
              transition-all duration-500
              ${isHovered ? "tracking-wide" : "tracking-normal"}
            `}
          >
            {text}
          </span>
        </div>

        {/* Enhanced sparkles with premium design */}
        <SparkleField isActive={isHovered} />

        {/* Edge highlight */}
        <div className="absolute inset-0 border border-white/5 pointer-events-none"></div>
      </button>
    </div>
  )
}

// Separated sparkle component for better organization
function SparkleField({ isActive }: { isActive: boolean }) {
  // Generate sparkle positions strategically rather than randomly
  const sparklePositions = [
    { top: "0%", left: "20%", size: "sm" as const, delay: 0 },
    { top: "0%", right: "20%", size: "md" as const, delay: 200 },
    { top: "100%", left: "30%", size: "sm" as const, delay: 400 },
    { top: "100%", right: "30%", size: "md" as const, delay: 600 },
    { top: "20%", left: "0%", size: "lg" as const, delay: 100 },
    { top: "20%", right: "0%", size: "sm" as const, delay: 300 },
    { top: "50%", left: "10%", size: "md" as const, delay: 500 },
    { top: "50%", right: "10%", size: "lg" as const, delay: 700 },
    { top: "80%", left: "0%", size: "sm" as const, delay: 800 },
    { top: "80%", right: "0%", size: "md" as const, delay: 900 },
    { top: "30%", left: "30%", size: "lg" as const, delay: 1000 },
    { top: "70%", right: "30%", size: "sm" as const, delay: 1100 },
    { top: "10%", left: "50%", size: "md" as const, delay: 1200 },
    { top: "90%", right: "50%", size: "lg" as const, delay: 1300 },
    { top: "40%", left: "80%", size: "sm" as const, delay: 1400 },
    { top: "60%", right: "80%", size: "md" as const, delay: 1500 },
  ]

  return (
    <>
      {sparklePositions.map((pos, i) => (
        <Sparkle key={i} position={pos} isActive={isActive} rotationDirection={i % 2 === 0 ? "cw" : "ccw"} />
      ))}
    </>
  )
}

// Individual sparkle component with premium animation
function Sparkle({
  position,
  isActive,
  rotationDirection,
}: {
  position: {
    top?: string
    left?: string
    right?: string
    bottom?: string
    size: "sm" | "md" | "lg"
    delay: number
  }
  isActive: boolean
  rotationDirection: "cw" | "ccw"
}) {
  const sizeMap = {
    sm: "w-1 h-1",
    md: "w-1.5 h-1.5",
    lg: "w-2 h-2",
  }

  const opacityClass = isActive ? "opacity-100" : "opacity-0"
  const animationClass = rotationDirection === "cw" ? "animate-rotate-cw" : "animate-rotate-ccw"
  const delayStyle = { animationDelay: `${position.delay}ms`, transitionDelay: `${position.delay * 0.5}ms` }

  return (
    <div
      className={`
        absolute 
        ${sizeMap[position.size]}
        bg-transparent 
        transition-opacity duration-700 ease-in-out
        ${opacityClass}
      `}
      style={{
        top: position.top,
        left: position.left,
        right: position.right,
        bottom: position.bottom,
        ...delayStyle,
      }}
    >
      <div
        className={`
          absolute inset-0 
          ${animationClass}
          animate-sparkle-fade
        `}
        style={delayStyle}
      >
        {/* Premium cross sparkle design */}
        <div className="absolute top-1/2 left-0 right-0 h-[0.5px] bg-gradient-to-r from-transparent via-white to-transparent transform -translate-y-1/2"></div>
        <div className="absolute top-0 bottom-0 left-1/2 w-[0.5px] bg-gradient-to-b from-transparent via-white to-transparent transform -translate-x-1/2"></div>
      </div>
    </div>
  )
} 