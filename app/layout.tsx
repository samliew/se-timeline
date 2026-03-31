import type { Metadata } from "next";
import "./styles/webflow.css";
import "./styles/main.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Stack Exchange Timeline",
  description:
    "A timeline of notable events for Stack Overflow and Stack Overflow Inc., as well as the Stack Exchange Network of sites",
  openGraph: {
    title: "The Stack Exchange Timeline",
    description:
      "A timeline of notable events for Stack Overflow and Stack Overflow Inc., as well as the Stack Exchange Network of sites",
    images: ["/img/site/se-og-image.png"],
    type: "website",
  },
  twitter: {
    title: "The Stack Exchange Timeline",
    description:
      "A timeline of notable events for Stack Overflow and Stack Overflow Inc., as well as the Stack Exchange Network of sites",
    images: ["/img/site/se-og-image.png"],
    card: "summary_large_image",
  },
  icons: {
    icon: "/img/site/favicon.ico",
    apple: "/img/site/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css?family=Open+Sans:400,400i,600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
