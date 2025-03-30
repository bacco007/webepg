"use client"

import { useEffect, useState } from "react"
import { Monitor, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { setCookie } from "@/lib/cookies"

const themes = [
  {
    key: "system",
    icon: Monitor,
    label: "System theme",
  },
  {
    key: "light",
    icon: Sun,
    label: "Light theme",
  },
  {
    key: "dark",
    icon: Moon,
    label: "Dark theme",
  },
]

export function ThemeSwitcher({ className }: { className?: string }) {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme)
    setCookie("theme", newTheme, { path: "/", maxAge: 31_536_000 })
  }

  if (!mounted) {
    return null
  }

  return (
    <div className={cn("relative flex h-8 rounded-full bg-background p-1 ring-1 ring-border", className)}>
      {themes.map(({ key, icon: Icon, label }) => {
        const isActive = theme === key

        return (
          <button
            type="button"
            key={key}
            className="relative rounded-full w-6 h-6"
            onClick={() => handleThemeChange(key)}
            aria-label={label}
          >
            {isActive && (
              <motion.div
                layoutId="activeTheme"
                className="absolute inset-0 bg-secondary rounded-full"
                transition={{ type: "spring", duration: 0.5 }}
              />
            )}
            <Icon className={cn("relative m-auto h-4 w-4", isActive ? "text-foreground" : "text-muted-foreground")} />
          </button>
        )
      })}
    </div>
  )
}
