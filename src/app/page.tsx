"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import SystemBoot from "../components/SystemBoot"

export default function Page() {
  const [done, setDone] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (done) {
      setTimeout(() => {
        router.push("/dashboard")
      }, 600)
    }
  }, [done, router])

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden">
      <SystemBoot onFinish={() => setDone(true)} />
    </div>
  )
}
