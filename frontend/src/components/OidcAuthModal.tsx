import { Component, createSignal, onMount, Show } from 'solid-js';
import { useAuth } from '../context/AuthContext';
import { Shield, KeyRound, ExternalLink, Check, AlertCircle, RefreshCw } from 'lucide-solid';

interface OidcAuthModalProps {
  onClose: () => void;
}

export const OidcAuthModal: Component<OidcAuthModalProps> = (props) => {
  const { user, loginWithToken } = useAuth();

  const [issuerUrl, setIssuerUrl] = createSignal(
    localStorage.getItem('authforest_issuer') || 'https://authforest.example.com'
  );
  const [clientId, setClientId] = createSignal(
    localStorage.getItem('authforest_client_id') || 'billease-web'
  );
  const [pastedJwt, setPastedJwt] = createSignal('');
  const [jwtParseResult, setJwtParseResult] = createSignal<any | null>(null);
  const [parseError, setParseError] = createSignal<string | null>(null);

  // Parse JWT payload on input
  const handleJwtInput = (token: string) => {
    setPastedJwt(token);
    setParseError(null);
    if (!token.trim()) {
      setJwtParseResult(null);
      return;
    }

    try {
      const parts = token.trim().split('.');
      if (parts.length >= 2) {
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        setJwtParseResult(payload);
      } else {
        setParseError('Token must be in JWT format (header.payload.signature)');
        setJwtParseResult(null);
      }
    } catch (err: any) {
      setParseError('Failed to parse JWT payload: ' + err.message);
      setJwtParseResult(null);
    }
  };

  const handleApplyJwt = () => {
    if (!jwtParseResult() || !pastedJwt()) return;
    
    // Extract role from claims
    const claims = jwtParseResult();
    const roleStr = claims.role || (claims.roles && claims.roles[0]) || (claims.realm_access?.roles && claims.realm_access.roles[0]) || 'CASHIER';
    const cleanRole = roleStr.toUpperCase().includes('ADMIN') ? (roleStr.toUpperCase().includes('SUPER') ? 'SUPER_ADMIN' : 'STORE_ADMIN') : 'CASHIER';
    
    loginWithToken(pastedJwt().trim(), {
      id: claims.sub || 'authforest-user',
      tenantId: claims.tenant_id || 'a0000000-0000-0000-0000-000000000001',
      username: claims.preferred_username || claims.email || claims.name || claims.sub || 'authforest_user',
      fullName: claims.name || claims.preferred_username || 'Authforest User',
      email: claims.email,
      role: cleanRole,
      isActive: true
    });

    props.onClose();
  };

  // Launch OIDC Authorization Code Flow with PKCE
  const handleStartOidcLogin = async () => {
    localStorage.setItem('authforest_issuer', issuerUrl().trim());
    localStorage.setItem('authforest_client_id', clientId().trim());

    // Generate random PKCE verifier
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const verifier = btoa(String.fromCharCode.apply(null, Array.from(array)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    
    sessionStorage.setItem('oidc_verifier', verifier);

    // Compute code challenge (SHA-256)
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    const challenge = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(digest))))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const redirectUri = window.location.origin;
    const authUrl = `${issuerUrl().trim().replace(/\/$/, '')}/authorize?response_type=code&client_id=${encodeURIComponent(clientId().trim())}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=openid%20profile%20email&code_challenge=${challenge}&code_challenge_method=S256`;

    window.location.href = authUrl;
  };

  return (
    <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        
        {/* Header */}
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Shield class="w-4 h-4" />
            </div>
            <div>
              <h3 class="text-sm font-bold text-slate-900">Authforest OIDC Configuration</h3>
              <p class="text-[11px] text-slate-500">External OAuth2 / OpenID Connect Provider</p>
            </div>
          </div>
          <button onClick={props.onClose} class="text-slate-400 hover:text-slate-600 font-bold text-sm">
            ✕
          </button>
        </div>

        {/* Current Auth Status */}
        <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
          <div>
            <span class="text-slate-500 text-[10px] uppercase font-bold block">Current Session User</span>
            <span class="font-bold text-slate-900">{user()?.fullName} ({user()?.role})</span>
          </div>
          <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
            Active
          </span>
        </div>

        {/* Tab 1: Live IdP Connection Settings */}
        <div class="space-y-3 text-xs">
          <h4 class="font-bold text-slate-800 flex items-center gap-1.5">
            <KeyRound class="w-3.5 h-3.5 text-indigo-600" />
            Authforest Connection Parameters
          </h4>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block font-medium text-slate-600 mb-1">Authforest Issuer URL</label>
              <input
                type="text"
                value={issuerUrl()}
                onInput={(e) => setIssuerUrl(e.currentTarget.value)}
                placeholder="http://localhost:8000"
                class="w-full p-2 rounded-lg border border-slate-200 font-mono text-[11px]"
              />
            </div>
            <div>
              <label class="block font-medium text-slate-600 mb-1">OIDC Client ID</label>
              <input
                type="text"
                value={clientId()}
                onInput={(e) => setClientId(e.currentTarget.value)}
                placeholder="billease-web"
                class="w-full p-2 rounded-lg border border-slate-200 font-mono text-[11px]"
              />
            </div>
          </div>

          <button
            onClick={handleStartOidcLogin}
            class="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-xs"
          >
            <ExternalLink class="w-4 h-4" />
            Launch Authforest Login Flow (PKCE)
          </button>
        </div>

        {/* Tab 2: Test / Inspect Authforest JWT Token Directly */}
        <div class="pt-3 border-t border-slate-100 space-y-2 text-xs">
          <div class="flex items-center justify-between">
            <h4 class="font-bold text-slate-800 flex items-center gap-1.5">
              <Shield class="w-3.5 h-3.5 text-emerald-600" />
              Test with Authforest JWT Token
            </h4>
            <span class="text-[10px] text-slate-400">Paste JWT to verify decoding</span>
          </div>

          <textarea
            rows="3"
            placeholder="Paste eyJhbGciOiJSUzI1NiIs..."
            value={pastedJwt()}
            onInput={(e) => handleJwtInput(e.currentTarget.value)}
            class="w-full p-2 rounded-lg border border-slate-200 font-mono text-[10px] focus:ring-2 focus:ring-emerald-500"
          />

          <Show when={parseError()}>
            <p class="text-rose-600 text-[11px] flex items-center gap-1">
              <AlertCircle class="w-3.5 h-3.5" /> {parseError()}
            </p>
          </Show>

          <Show when={jwtParseResult()}>
            <div class="p-2.5 bg-slate-900 text-emerald-400 rounded-lg font-mono text-[10px] space-y-1 max-h-32 overflow-y-auto">
              <div class="text-slate-400 font-bold uppercase">Decoded OIDC Claims:</div>
              <div><b>sub:</b> {jwtParseResult().sub}</div>
              <div><b>preferred_username:</b> {jwtParseResult().preferred_username || jwtParseResult().name || '-'}</div>
              <div><b>role/roles:</b> {JSON.stringify(jwtParseResult().role || jwtParseResult().roles || jwtParseResult().realm_access?.roles || 'CASHIER')}</div>
              <div><b>tenant_id:</b> {jwtParseResult().tenant_id || '(global)'}</div>
            </div>

            <button
              onClick={handleApplyJwt}
              class="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Check class="w-4 h-4" />
              Sign in with this Authforest Identity
            </button>
          </Show>
        </div>

      </div>
    </div>
  );
};

