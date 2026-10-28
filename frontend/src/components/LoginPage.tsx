import { Component, createSignal, Show } from 'solid-js';
import { useAuth } from '../context/AuthContext';
import { KeyRound, LogIn, ExternalLink, AlertCircle, ShoppingBag } from 'lucide-solid';

export const LoginPage: Component = () => {
  const { loginWithCredentials, loginWithOidcRedirect, oidcConfig, setOidcConfig } = useAuth();

  const [username, setUsername] = createSignal('');
  const [password, setPassword] = createSignal('');
  const [error, setError] = createSignal<string | null>(null);
  const [loading, setLoading] = createSignal(false);
  const [showSsoPanel, setShowSsoPanel] = createSignal(false);
  const [ssoIssuer, setSsoIssuer] = createSignal(oidcConfig().issuerUrl);
  const [ssoClientId, setSsoClientId] = createSignal(oidcConfig().clientId);
  const [ssoLoading, setSsoLoading] = createSignal(false);

  const handleLogin = async (e: Event) => {
    e.preventDefault();
    if (!username().trim() || !password()) return;
    setError(null);
    setLoading(true);
    try {
      const err = await loginWithCredentials(username().trim(), password());
      if (err) setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSsoLogin = async () => {
    setOidcConfig({ issuerUrl: ssoIssuer().trim(), clientId: ssoClientId().trim() });
    setSsoLoading(true);
    try {
      await loginWithOidcRedirect();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'SSO login failed');
      setSsoLoading(false);
    }
  };

  return (
    <div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 flex items-center justify-center p-4">
      <div class="w-full max-w-md">

        {/* Logo + Brand */}
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500 shadow-2xl mb-4">
            <ShoppingBag class="w-9 h-9 text-white" />
          </div>
          <h1 class="text-3xl font-black text-white tracking-tight">Billease</h1>
          <p class="text-emerald-300 text-sm mt-1">Indian Retail & POS Platform</p>
        </div>

        {/* Login Card */}
        <div class="bg-white rounded-3xl shadow-2xl overflow-hidden">

          {/* Header */}
          <div class="bg-gradient-to-r from-emerald-600 to-emerald-500 px-6 py-5">
            <h2 class="text-lg font-bold text-white">Sign in to your store</h2>
            <p class="text-emerald-100 text-xs mt-0.5">Use your credentials or SSO</p>
          </div>

          <div class="p-6 space-y-5">

            {/* Error */}
            <Show when={error()}>
              <div class="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-4 py-3">
                <AlertCircle class="w-4 h-4 shrink-0" />
                <span>{error()}</span>
              </div>
            </Show>

            {/* Username/Password Form */}
            <form onSubmit={handleLogin} class="space-y-4">
              <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1.5">Username</label>
                <input
                  type="text"
                  autocomplete="username"
                  placeholder="e.g. ganesh_owner"
                  value={username()}
                  onInput={(e) => setUsername(e.currentTarget.value)}
                  class="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  required
                />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1.5">Password</label>
                <input
                  type="password"
                  autocomplete="current-password"
                  placeholder="••••••••"
                  value={password()}
                  onInput={(e) => setPassword(e.currentTarget.value)}
                  class="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading()}
                class="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <Show when={!loading()} fallback={<span class="animate-pulse">Signing in…</span>}>
                  <LogIn class="w-4 h-4" />
                  Sign In
                </Show>
              </button>
            </form>

            {/* Divider */}
            <div class="flex items-center gap-3 text-slate-300">
              <div class="flex-1 h-px bg-slate-200" />
              <span class="text-xs text-slate-400 font-medium">or</span>
              <div class="flex-1 h-px bg-slate-200" />
            </div>

            {/* SSO Toggle */}
            <button
              type="button"
              onClick={() => setShowSsoPanel(!showSsoPanel())}
              class="w-full border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-700 font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition text-sm"
            >
              <KeyRound class="w-4 h-4 text-indigo-500" />
              Sign in with SSO / OIDC
            </button>

            <Show when={showSsoPanel()}>
              <div class="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3">
                <p class="text-[11px] text-slate-500 font-medium uppercase tracking-wide">OIDC Provider Configuration</p>
                <div>
                  <label class="block text-xs font-semibold text-slate-600 mb-1">Issuer URL</label>
                  <input
                    type="url"
                    placeholder="https://your-idp.example.com"
                    value={ssoIssuer()}
                    onInput={(e) => setSsoIssuer(e.currentTarget.value)}
                    class="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-600 mb-1">Client ID</label>
                  <input
                    type="text"
                    placeholder="billease-web"
                    value={ssoClientId()}
                    onInput={(e) => setSsoClientId(e.currentTarget.value)}
                    class="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>
                <button
                  type="button"
                  disabled={ssoLoading()}
                  onClick={handleSsoLogin}
                  class="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition"
                >
                  <ExternalLink class="w-3.5 h-3.5" />
                  <Show when={!ssoLoading()} fallback="Redirecting…">
                    Continue with SSO (PKCE)
                  </Show>
                </button>
              </div>
            </Show>

          </div>

          {/* Demo credentials hint */}
          <div class="px-6 pb-6">
            <div class="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 space-y-1">
              <p class="font-bold text-amber-900">Demo Accounts</p>
              <p><span class="font-mono bg-amber-100 px-1 rounded">ganesh_owner</span> / <span class="font-mono bg-amber-100 px-1 rounded">store123</span> — Store Owner</p>
              <p><span class="font-mono bg-amber-100 px-1 rounded">cashier1</span> / <span class="font-mono bg-amber-100 px-1 rounded">cashier123</span> — Cashier</p>
              <p><span class="font-mono bg-amber-100 px-1 rounded">superadmin</span> / <span class="font-mono bg-amber-100 px-1 rounded">admin123</span> — Super Admin</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
