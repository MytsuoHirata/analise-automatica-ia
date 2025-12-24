"use client";

import { useState } from "react";
import MatrixRain from "../components/MatrixRain";
import Dashboard from "../app/dashboard/page";

export default function Home() {
  const [enter, setEnter] = useState(false);

  return (
    <div className="relative w-full h-screen bg-black text-green-400 font-mono">
      
      {!enter && (
        <>
          <div className="absolute inset-0 -z-10">
            <MatrixRain />
          </div>

          <div className="h-full flex flex-col justify-center items-center space-y-6">
            <h1 className="text-4xl tracking-widest">S Y N T R A X</h1>

            <button
              onClick={() => setEnter(true)}
              className="border border-green-500 px-6 py-3 hover:bg-green-500 hover:text-black transition-all"
            >
              ENTER SYSTEM
            </button>
          </div>
        </>
      )}

      {enter && <Dashboard />}
    </div>
  );
}
