/** Unused by default routes; kept as a minimal fallback page. */
export default function Index() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-2 p-8">
        <p className="text-lg font-semibold text-foreground">Operis</p>
        <p className="text-sm text-muted-foreground">Open the app from the landing route.</p>
      </div>
    </div>
  );
}
