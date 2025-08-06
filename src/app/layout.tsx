// src/app/layout.tsx
import "./globals.css";
import { UserProvider } from "@/context/UserContext";

export const metadata = {
  title: "My App",
  description: "My Description",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <UserProvider>{children}</UserProvider>
      </body>
    </html>
  );
}
