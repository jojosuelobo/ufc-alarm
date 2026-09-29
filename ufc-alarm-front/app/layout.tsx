import type { Metadata } from "next";
import { Bebas_Neue, Inter } from "next/font/google";
import TopNav from "@/components/TopNav";
import AlarmWatcher from "@/components/AlarmWatcher";
import { getCurrentUser } from "@/lib/auth/dal";
import "./globals.css";

const bebasNeue = Bebas_Neue({
  variable: "--font-bebas",
  weight: "400",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "UFC Alarm",
  description: "Próximos eventos de UFC, cards de luta e alertas por notificação.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  return (
    <html
      lang="pt-BR"
      className={`${bebasNeue.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <TopNav user={user} />
        <main className="flex-1">{children}</main>
        <AlarmWatcher userId={user?.id ?? null} enabled={user?.notifySite ?? true} />
      </body>
    </html>
  );
}
