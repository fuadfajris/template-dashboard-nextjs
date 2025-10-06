// src/app/layout.tsx
import { Outfit } from 'next/font/google';
import { SidebarProvider } from "@/context/SidebarContext";
import "./globals.css";
import { UserProvider } from "@/context/UserContext";
import { ThemeProvider } from "@/context/ThemeContext";

export const metadata = {
  title: "My App",
  description: "My Description",
};

const outfit = Outfit({
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${outfit.className} dark:bg-gray-900 bg-gray-50`}>
        <UserProvider>
          <ThemeProvider>
            <SidebarProvider>{children}</SidebarProvider>
          </ThemeProvider>
        </UserProvider>
      </body>
    </html>
  );
}
