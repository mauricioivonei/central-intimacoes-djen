import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Central de Intimacoes DJEN",
  description:
    "Sistema web para triagem de intimacoes, controle de prazos processuais e envio seguro de tarefas para agenda.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
