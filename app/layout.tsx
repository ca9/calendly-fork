import '@/styles/globals.css';

export const metadata = {
    title: 'Meeting Booking Platform',
    description: 'A platform to book meetings using Google Calendar API',
};

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
        <head>
            <link rel="shortcut icon" href="/images/favicon.ico" />
        </head>
        <body className="bg-gray-900 text-white">{children}</body>
        </html>
    );
}
