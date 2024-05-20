import './globals.css';

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
        <body className="bg-gray-900 text-white">{children}</body>
        </html>
    );
}
