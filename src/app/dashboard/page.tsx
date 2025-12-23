"use client"

import { useEffect, useRef, useState } from "react"

/* ================= TYPES ================= */
type Status = "ANALYZED" | "EMAIL_SENT"
type Priority = "HIGH" | "MEDIUM" | "LOW"

type HistoryItem = {
  id: string
  url: string
  email: string
  country: string
  date: string
  logs: string[]
  status: Status
  priority: Priority
}

type HistoryByCountry = Record<string, HistoryItem[]>

/* ================= HELPERS ================= */
const genId = () =>
  Date.now().toString(36) + Math.random().toString(36).substring(2)

const calculatePriority = (logs: string[]): Priority => {
  const text = logs.join(" ").toLowerCase()

  if (
    text.includes("slow") ||
    text.includes("performance") ||
    text.includes("error") ||
    text.includes("seo")
  ) {
    return "HIGH"
  }

  if (
    text.includes("improve") ||
    text.includes("warning") ||
    text.includes("optimize")
  ) {
    return "MEDIUM"
  }

  return "LOW"
}

/* ================= COMPONENT ================= */
export default function Dashboard() {
  const [url, setUrl] = useState("")
  const [email, setEmail] = useState("")
  const [logs, setLogs] = useState<string[]>([])
  const [history, setHistory] = useState<HistoryByCountry>({})
  const [selected, setSelected] = useState<HistoryItem | null>(null)
  const [typing, setTyping] = useState(false)

  const queueRef = useRef<string[]>([])

  /* ================= LOAD ================= */
  useEffect(() => {
    const saved = localStorage.getItem("history_by_country")
    if (saved) setHistory(JSON.parse(saved))
  }, [])

  const persist = (data: HistoryByCountry) => {
    setHistory(data)
    localStorage.setItem("history_by_country", JSON.stringify(data))
  }

  /* ================= TYPE EFFECT ================= */
  const typeLog = (text: string, speed = 22) =>
    new Promise<void>((resolve) => {
      let i = 0
      setLogs((l) => [...l, ""])
      const index = logs.length

      const interval = setInterval(() => {
        setLogs((l) => {
          const copy = [...l]
          copy[index] = (copy[index] || "") + text[i]
          return copy
        })
        i++
        if (i >= text.length) {
          clearInterval(interval)
          resolve()
        }
      }, speed)
    })

  const processQueue = async () => {
    if (typing) return
    setTyping(true)

    while (queueRef.current.length > 0) {
      const msg = queueRef.current.shift()
      if (msg) {
        await typeLog(msg)
        await new Promise((r) => setTimeout(r, 250))
      }
    }

    setTyping(false)
  }

  /* ================= VALIDATION ================= */
  const urlExists = (u: string) =>
    Object.values(history).some((list) =>
      list.some((item) => item.url === u)
    )

  /* ================= ANALYZE ================= */
  const analyze = async () => {
    if (!url || !email) {
      alert("URL e email são obrigatórios")
      return
    }

    if (urlExists(url)) {
      alert("Esse site já foi analisado")
      return
    }

    setLogs([])
    queueRef.current = [">> starting analysis..."]

    let finalLogs: string[] = []
    let detectedCountry = "Unknown"

    try {
      const res = await fetch("analise-automatica-ia-production.up.railway.app/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      })

      const data = await res.json()

      if (data.country) {
        detectedCountry = data.country
        finalLogs.push(`location detected: ${detectedCountry}`)
        queueRef.current.push(`location detected: ${detectedCountry}`)
      }

      if (Array.isArray(data.logs)) {
        data.logs.forEach((log: string) => {
          finalLogs.push(log)
          queueRef.current.push(log)
        })
      }
    } catch {
      finalLogs.push("❌ backend offline")
      queueRef.current.push("❌ backend offline")
    }

    const priority = calculatePriority(finalLogs)

    const item: HistoryItem = {
      id: genId(),
      url,
      email,
      country: detectedCountry,
      date: new Date().toLocaleString(),
      logs: finalLogs,
      status: "ANALYZED",
      priority,
    }

    const updated: HistoryByCountry = {
      ...history,
      [detectedCountry]: [item, ...(history[detectedCountry] || [])],
    }

    persist(updated)
setSelected(item)

// 🔥 AUTO-ENVIO SE PRIORIDADE = HIGH
if (priority === "HIGH") {
  queueRef.current.push("priority HIGH detected")
  queueRef.current.push("sending email automatically...")

  try {
    await fetch("analise-automatica-ia-production.up.railway.app/send-smart-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: email,
        url,
        country: detectedCountry,
      }),
    })

    queueRef.current.push("email sent automatically")

    const autoUpdated: HistoryByCountry = {
      ...updated,
      [detectedCountry]: updated[detectedCountry].map(
        (h): HistoryItem =>
          h.id === item.id
            ? { ...h, status: "EMAIL_SENT" }
            : h
      ),
    }

    persist(autoUpdated)
    setSelected({ ...item, status: "EMAIL_SENT" })
  } catch {
    queueRef.current.push("❌ auto email failed")
  }
}

processQueue()

  }

  /* ================= EMAIL ================= */
  const sendEmail = async () => {
    if (!selected) return

    await fetch("http://127.0.0.1:8000/send-smart-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: selected.email,
        url: selected.url,
        country: selected.country,
      }),
    })

    const updated: HistoryByCountry = {
      ...history,
      [selected.country]: history[selected.country].map(
        (h): HistoryItem =>
          h.id === selected.id
            ? { ...h, status: "EMAIL_SENT" as Status }
            : h
      ),
    }

    persist(updated)
    setSelected({ ...selected, status: "EMAIL_SENT" })
  }

  /* ================= UI ================= */
  return (
    <div className="min-h-screen grid grid-cols-[300px_1fr] bg-black text-green-400 font-mono">
      {/* HISTORY */}
      <aside className="border-r border-green-500 p-4 overflow-auto">
        {Object.entries(history).map(([country, items]) => (
          <div key={country} className="mb-4">
            <div className="text-xs opacity-60 mb-1">{country}</div>

            {items.map((h) => (
              <button
                key={h.id}
                onClick={() => {
                  setSelected(h)
                  setLogs(h.logs)
                }}
                className="w-full text-left border border-green-500 p-2 text-xs mb-1 hover:bg-green-500 hover:text-black"
              >
                <div className="flex justify-between">
                  <span className="truncate">{h.url}</span>
                  <span
                    className={
                      h.priority === "HIGH"
                        ? "text-red-500"
                        : h.priority === "MEDIUM"
                        ? "text-yellow-400"
                        : "text-green-400"
                    }
                  >
                    {h.priority}
                  </span>
                </div>
              </button>
            ))}
          </div>
        ))}
      </aside>

      {/* PANEL */}
      <main className="flex items-center justify-center">
        <div className="w-full max-w-xl space-y-4">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://site.com"
            className="w-full bg-black border border-green-500 p-3"
          />

          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="contact@email.com"
            className="w-full bg-black border border-green-500 p-3"
          />

          <div className="flex gap-2 justify-center">
            <button
              onClick={analyze}
              className="border border-green-500 px-6 py-2 hover:bg-green-500 hover:text-black"
            >
              ANALISAR
            </button>

            {selected && selected.status === "ANALYZED" && (
              <button
                onClick={sendEmail}
                className="border border-green-400 px-6 py-2 hover:bg-green-400 hover:text-black"
              >
                ENVIAR EMAIL
              </button>
            )}
          </div>

          <div className="border border-green-500 p-3 h-64 overflow-auto text-sm">
            {logs.map((log, i) => (
              <div key={i}>{log}</div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
