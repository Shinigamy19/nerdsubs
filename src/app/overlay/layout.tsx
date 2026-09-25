export const metadata = {
  title: "NerdSubs Overlay",
};

export default function OverlayLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {/* Override root layout body styles for transparent OBS compositing */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            body {
              background: transparent !important;
              background-color: transparent !important;
            }
          `,
        }}
      />
      {children}
    </>
  );
}
