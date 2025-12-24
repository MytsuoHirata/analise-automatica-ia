"use client";

import { useState } from "react";
import MatrixRain from "../components/MatrixRain";
import Dashboard from "../app/dashboard/page"; 

export default function Home() {
  const [enter, setEnter] = useState(false);

  // Quando clicar no botão, troca pra dashboard
  if (enter) return <Dashboard />;

  return (
    <div className="relative w-full h-screen bg-black text-green-400 font-mono flex items-center justify-center">

      {/* Chuva de código */}
      <div className="absolute inset-0 -z-10">
        <MatrixRain />
      </div>

      {/* Tela inicial */}
      <div className="text-center space-y-6">
        <h1 className="text-4xl tracking-widest">S Y N T R A X</h1>

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
