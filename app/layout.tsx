import "@/app/ui/global.scss";
import { inter } from "@/app/ui/fonts";
import { Metadata } from "next";

// static metadata object
export const metadata: Metadata = {
    title: {
        template: "%s | Acme Dashboard", // The %s in the template will be replaced with the title specified by the page metadata.
        default: "Acme Dashboard",
    },
    description: "The official Next.js Learn Dashboard built with App Router.",
    metadataBase: new URL("https://next-learn-dashboard.vercel.sh"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body className={`${inter.className} antialiased`}>
                {/* Layout at most topmost level applied to all routes and route groups
                    Even if the topmost page.tsx (i.e. '/' route) is in a route group with a separate layout.tsx, this layout will still be applied first.
                */}

                {/* <div>Root Layout</div> */}
                <main>{children}</main>
            </body>
        </html>
    );
}
