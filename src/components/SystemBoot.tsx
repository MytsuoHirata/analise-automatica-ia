"use client"

import { useEffect, useState } from "react"

export default function SystemBoot({
  onFinish,
}: {
  onFinish: () => void
}) {
  const [percent, setPercent] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setPercent((p) => {
        if (p >= 100) {
          clearInterval(interval)
          setTimeout(onFinish, 500)
          return 100
        }
        return p + 1
      })
    }, 35)

    return () => clearInterval(interval)
  }, [onFinish])

  return (
    <div className="flex items-center justify-center w-full h-full bg-black text-green-400 font-mono">
      <div className="flex items-center gap-4 text-xl">
        <span>☠</span>
        <span>INITIALIZING SYSTEM {percent}%</span>
      </div>
    </div>
  )
}
