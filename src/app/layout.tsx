import "./globals.css";

export const metadata = {
  title: "SYNTRAX",
  description: "Automated Website Intelligence System",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-black text-green-400 font-mono">
        {children}
      </body>
    </html>
  );
}
