import "./globals.css"
import MatrixRain from "../components/MatrixRain"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-black overflow-hidden">
        <MatrixRain />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  )
}
