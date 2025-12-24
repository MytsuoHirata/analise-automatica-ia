"use client";

import MatrixRain from "../components/MatrixRain";
import { useState } from "react";
import Dashboard from "./dashboard/page";

export default function Home() {
  const [enter, setEnter] = useState(false);

  if (enter) return <Dashboard />;

  return (
    <div className="relative w-full h-screen bg-black text-green-400 font-mono flex items-center justify-center">
      {/* Chuva de código */}
      <div className="absolute inset-0 -z-10">
        <MatrixRain />
      </div>

      <div className="text-center space-y-6">
        <h1 className="text-4xl tracking-widest">MATRIX ACCESS PANEL</h1>
        <button
          onClick={() => setEnter(true)}
          className="border border-green-500 px-6 py-3 hover:bg-green-500 hover:text-black transition-all"
        >
          ENTER SYSTEM
        </button>
      </div>
    </div>
  );
}
