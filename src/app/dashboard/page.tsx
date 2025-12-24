"use client";

import { useEffect, useRef, useState } from "react";

const BACKEND = "https://analise-automatica-ia-production.up.railway.app";

type Status = "ANALYZED" | "EMAIL_SENT";
type Priority = "HIGH" | "MEDIUM" | "LOW";

type HistoryItem = {
  id: string;
  url: string;
  email: string;
  country: string;
  date: string;
  logs: string[];
  status: Status;
  priority: Priority;
};

type HistoryByCountry = Record<string, HistoryItem[]>;

const genId = () =>
  Date.now().toString(36) + Math.random().toString(36).substring(2);

const calculatePriority = (logs: string[]): Priority => {
  const t = logs.join(" ").toLowerCase();
  if (
    t.includes("slow") ||
    t.includes("error") ||
    t.includes("seo") ||
    t.includes("performance")
  )
    return "HIGH";
  if (t.includes("improve") || t.includes("optimize")) return "MEDIUM";
  return "LOW";
};

export default function Dashboard() {
  const [url, setUrl] = useState("");
  const [email, setEmail] = useState("");
  const [logs, setLogs] = useState<string[]>([]);
  const [history, setHistory] = useState<HistoryByCountry>({});
  const [selected, setSelected] = useState<HistoryItem | null>(null);
  const [typing, setTyping] = useState(false);

  const queueRef = useRef<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("history_by_country");
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const persist = (data: HistoryByCountry) => {
    localStorage.setItem("history_by_country", JSON.stringify(data));
    setHistory(data);
  };

  const typeLog = (text: string, speed = 25) =>
    new Promise<void>((resolve) => {
      let i = 0;
      setLogs((l) => [...l, ""]);
      const index = logs.length;

      const interval = setInterval(() => {
        setLogs((l) => {
          const x = [...l];
          x[index] = (x[index] ?? "") + text[i];
          return x;
        });
        i++;
        if (i >= text.length) {
          clearInterval(interval);
          resolve();
        }
      }, speed);
    });

  const processQueue = async () => {
    if (typing) return;
    setTyping(true);

    while (queueRef.current.length) {
      const msg = queueRef.current.shift();
      if (msg) {
        await typeLog(msg);
        await new Promise((r) => setTimeout(r, 120));
      }
    }
    setTyping(false);
  };

  const analyze = async () => {
    if (!url || !email) {
      alert("URL e email obrigatórios");
      return;
    }

    setLogs([]);
    queueRef.current = [">> starting analysis..."];

    let detectedCountry = "Unknown";
    let finalLogs: string[] = [];

    try {
      const res = await fetch(`${BACKEND}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      detectedCountry = data.country || "Unknown";
      finalLogs.push(`location: ${detectedCountry}`);
      queueRef.current.push(`location: ${detectedCountry}`);

      if (Array.isArray(data.logs)) {
        data.logs.forEach((l: string) => {
          finalLogs.push(l);
          queueRef.current.push(l);
        });
      }
    } catch {
      finalLogs.push("backend offline");
      queueRef.current.push("backend offline");
    }

    const priority = calculatePriority(finalLogs);

    const item: HistoryItem = {
      id: genId(),
      url,
      email,
      country: detectedCountry,
      date: new Date().toLocaleString(),
      logs: finalLogs,
      status: "ANALYZED",
      priority,
    };

    const updated: HistoryByCountry = {
      ...history,
      [detectedCountry]: [item, ...(history[detectedCountry] || [])],
    };

    persist(updated);
    setSelected(item);

    // AUTO-EMAIL PARA HIGH
    if (priority === "HIGH") {
      queueRef.current.push("priority HIGH detected");
      queueRef.current.push("sending email automatically...");

      try {
        await fetch(`${BACKEND}/send-smart-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: email,
            url,
            country: detectedCountry,
          }),
        });

        queueRef.current.push("email sent automatically");

        const newHist: HistoryByCountry = {
          ...updated,
          [detectedCountry]: updated[detectedCountry].map((h) =>
            h.id === item.id ? { ...h, status: "EMAIL_SENT" } : h
          ),
        };

        persist(newHist);
        setSelected({ ...item, status: "EMAIL_SENT" });
      } catch {
        queueRef.current.push("auto email failed");
      }
    }

    processQueue();
  };

  return (
    <div className="min-h-screen grid grid-cols-[260px_1fr] bg-black text-green-400 font-mono">
      <aside className="border-r border-green-500 p-3 overflow-auto">
        <h1 className="text-sm opacity-60 mb-3">HISTÓRICO</h1>

        {Object.entries(history).map(([country, items]) => (
          <div key={country} className="mb-4">
            <div className="text-xs opacity-60">{country}</div>
            {items.map((h) => (
              <button
                key={h.id}
                onClick={() => {
                  setSelected(h);
                  setLogs(h.logs);
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
          </div>

          <div className="border border-green-500 p-3 h-72 overflow-auto text-sm">
            {logs.map((l, i) => (
              <div key={i}>{l}</div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
