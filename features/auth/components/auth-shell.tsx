type AuthShellProps = {
  children: React.ReactNode;
};

export function AuthShell({ children }: AuthShellProps) {
  return <main className="mx-auto grid min-h-screen w-full max-w-6xl gap-5 px-4 py-5 sm:gap-6 sm:py-6 lg:grid-cols-[1.1fr_0.9fr]">{children}</main>;
}
