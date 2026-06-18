type AuthShellProps = {
  children: React.ReactNode;
};

export function AuthShell({ children }: AuthShellProps) {
  return (
    <main className="mx-auto grid min-h-screen w-full max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[1.1fr_0.9fr]">
      {children}
    </main>
  );
}
