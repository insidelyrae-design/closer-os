export const metadata = {
  title: "CLOSER OS — Sales Psychology Operating System",
  description: "Elite sales psychology. Objection handling, decision forensics, link analysis, buyer psychology.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: "#080808" }}>
        {children}
      </body>
    </html>
  );
}
