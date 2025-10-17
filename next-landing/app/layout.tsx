export const metadata = {
  title: "DashMaster.PRO - Landing",
  description: "Landing pública alimentada pela API do DashMaster.PRO",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body>{children}</body>
    </html>
  );
}
