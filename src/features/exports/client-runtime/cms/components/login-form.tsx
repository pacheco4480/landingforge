import { clientCmsLoginAction } from "../auth.actions";

export function ClientCmsLoginForm({ error }: { error?: "invalid" }) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-12">
      <form action={clientCmsLoginAction} className="w-full space-y-5 border border-border p-6 sm:p-8">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Área reservada</p>
          <h1 className="mt-2 text-2xl font-semibold">Entrar no CMS</h1>
        </div>
        {error ? <p role="alert" className="text-sm text-destructive">Os dados de acesso não são válidos.</p> : null}
        <div className="space-y-2">
          <label htmlFor="client-cms-email" className="text-sm font-medium">Email</label>
          <input id="client-cms-email" name="email" type="email" autoComplete="username" required maxLength={254}
            className="min-h-11 w-full border border-input bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        </div>
        <div className="space-y-2">
          <label htmlFor="client-cms-password" className="text-sm font-medium">Palavra-passe</label>
          <input id="client-cms-password" name="password" type="password" autoComplete="current-password" required maxLength={200}
            className="min-h-11 w-full border border-input bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        </div>
        <button type="submit" className="min-h-11 w-full bg-primary px-4 font-medium text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          Entrar
        </button>
      </form>
    </main>
  );
}
