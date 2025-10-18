"use client";

import { SessionProvider } from "next-auth/react";
import Navigation from "@/components/navigation";

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <Navigation />
            {children}
        </SessionProvider>
    );
}
