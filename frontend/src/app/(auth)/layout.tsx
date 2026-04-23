export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          Farmille
        </h1>
      </div>
      <div className="w-full max-w-md bg-white rounded-lg border border-zinc-200 p-8 shadow-sm">
        {children}
      </div>
    </div>
  );
}
