export default function BuilderLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-[calc(100vh-56px)] overflow-hidden">
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
