import { createContext, useContext, createSignal, JSX, onMount } from 'solid-js';
import { User, Tenant, Role } from '../types';
import { apiClient } from '../api/client';

interface AuthContextType {
  user: () => User | null;
  tenant: () => Tenant | null;
  token: () => string;
  isSuperAdmin: () => boolean;
  isStoreAdmin: () => boolean;
  isCashier: () => boolean;
  switchRole: (role: Role) => void;
  updateTenantData: (updates: Partial<Tenant>) => Promise<void>;
  loginWithToken: (token: string, user: User) => void;
  oidcIssuer: () => string;
  oidcClientId: () => string;
  setOidcConfig: (issuer: string, clientId: string) => void;
  initiateAuthforestLogin: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>();

export function AuthProvider(props: { children: JSX.Element }) {
  const getInitialUser = (): User => {
    const saved = sessionStorage.getItem('billease_user');
    if (saved) {
      try {
        return JSON.parse(saved) as User;
      } catch {
        // fallback
      }
    }
    return {
      id: 'b0000000-0000-0000-0000-000000000002',
      tenantId: 'a0000000-0000-0000-0000-000000000001',
      username: 'ganesh_owner',
      fullName: 'Ganesh Patil (Owner)',
      role: 'STORE_ADMIN',
      isActive: true
    };
  };

  const [user, setUser] = createSignal<User | null>(getInitialUser());
  const [tenant, setTenant] = createSignal<Tenant | null>(null);
  const [token, setToken] = createSignal<string>(sessionStorage.getItem('billease_token') || 'owner-token');
  
  const [oidcIssuer, setOidcIssuer] = createSignal<string>(
    sessionStorage.getItem('authforest_issuer') || 'http://localhost:8080'
  );
  const [oidcClientId, setOidcClientId] = createSignal<string>(
    sessionStorage.getItem('authforest_client_id') || 'billease-web'
  );

  onMount(async () => {
    // 1. Fetch default tenant data
    const t = await apiClient.getTenant('a0000000-0000-0000-0000-000000000001');
    setTenant(t);

    // 2. Check for incoming AuthForest / OIDC Authorization Code in URL
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');

    if (code) {
      const storedVerifier = sessionStorage.getItem('authforest_pkce_verifier');
      if (storedVerifier) {
        try {
          await exchangeAuthforestCode(code, storedVerifier);
        } catch (err) {
          console.error('Failed to exchange AuthForest authorization code:', err);
        } finally {
          sessionStorage.removeItem('authforest_pkce_verifier');
          // Clean code query parameter from browser bar
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    }
  });

  const exchangeAuthforestCode = async (code: string, verifier: string) => {
    const issuer = oidcIssuer().replace(/\/$/, '');
    const redirectUri = window.location.origin;

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectUri,
      client_id: oidcClientId(),
      code_verifier: verifier
    });

    const res = await fetch(`${issuer}/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString()
    });

    if (!res.ok) {
      throw new Error(`AuthForest token exchange returned ${res.status}`);
    }

    const data = await res.json();
    const accessToken = data.access_token;
    const idToken = data.id_token || data.access_token;

    // Decode ID Token payload
    const parts = idToken.split('.');
    if (parts.length >= 2) {
      const claims = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      const sub = claims.sub || 'authforest-user';
      const roleStr = claims.role || (claims.roles && claims.roles[0]) || 'STORE_ADMIN';
      const cleanRole: Role = roleStr.toUpperCase().includes('SUPER')
        ? 'SUPER_ADMIN'
        : (roleStr.toUpperCase().includes('ADMIN') || roleStr.toUpperCase().includes('OWNER') ? 'STORE_ADMIN' : 'CASHIER');

      loginWithToken(accessToken, {
        id: sub,
        tenantId: claims.tenant_id || 'a0000000-0000-0000-0000-000000000001',
        username: claims.preferred_username || claims.email || sub,
        fullName: claims.name || claims.preferred_username || 'AuthForest User',
        email: claims.email,
        role: cleanRole,
        isActive: true
      });
    }
  };

  const initiateAuthforestLogin = async () => {
    const issuer = oidcIssuer().replace(/\/$/, '');
    const clientId = oidcClientId();
    const redirectUri = window.location.origin;

    // Generate random PKCE verifier (32 bytes base64url)
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const verifier = btoa(String.fromCharCode.apply(null, Array.from(array)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    sessionStorage.setItem('authforest_pkce_verifier', verifier);

    // Compute code challenge (SHA-256)
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    const challenge = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(digest))))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const state = Math.random().toString(36).substring(2);
    const authUrl = `${issuer}/oauth2/authorize?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=openid%20profile%20email&code_challenge=${challenge}&code_challenge_method=S256&state=${state}`;

    window.location.href = authUrl;
  };

  const setOidcConfig = (issuer: string, clientId: string) => {
    setOidcIssuer(issuer);
    setOidcClientId(clientId);
    sessionStorage.setItem('authforest_issuer', issuer);
    sessionStorage.setItem('authforest_client_id', clientId);
  };

  const isSuperAdmin = () => user()?.role === 'SUPER_ADMIN';
  const isStoreAdmin = () => user()?.role === 'STORE_ADMIN';
  const isCashier = () => user()?.role === 'CASHIER';

  const loginWithToken = (t: string, u: User) => {
    setToken(t);
    setUser(u);
    sessionStorage.setItem('billease_token', t);
    sessionStorage.setItem('billease_user', JSON.stringify(u));
  };

  const logout = () => {
    sessionStorage.removeItem('billease_token');
    sessionStorage.removeItem('billease_user');
    sessionStorage.removeItem('authforest_pkce_verifier');
    switchRole('CASHIER');
  };

  const switchRole = (role: Role) => {
    if (role === 'SUPER_ADMIN') {
      setUser({
        id: 'b0000000-0000-0000-0000-000000000001',
        username: 'superadmin',
        fullName: 'Super Administrator',
        role: 'SUPER_ADMIN',
        isActive: true
      });
      setToken('superadmin-token');
    } else if (role === 'STORE_ADMIN') {
      setUser({
        id: 'b0000000-0000-0000-0000-000000000002',
        tenantId: 'a0000000-0000-0000-0000-000000000001',
        username: 'ganesh_owner',
        fullName: 'Ganesh Patil (Store Owner)',
        role: 'STORE_ADMIN',
        isActive: true
      });
      setToken('owner-token');
    } else {
      setUser({
        id: 'b0000000-0000-0000-0000-000000000003',
        tenantId: 'a0000000-0000-0000-0000-000000000001',
        username: 'cashier1',
        fullName: 'Rahul Deshmukh (Cashier)',
        role: 'CASHIER',
        isActive: true
      });
      setToken('cashier-token');
    }
  };

  const updateTenantData = async (updates: Partial<Tenant>) => {
    const t = tenant();
    if (!t) return;
    const updated = await apiClient.updateTenant(t.id, token(), updates);
    setTenant(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        tenant,
        token,
        isSuperAdmin,
        isStoreAdmin,
        isCashier,
        switchRole,
        updateTenantData,
        loginWithToken,
        oidcIssuer,
        oidcClientId,
        setOidcConfig,
        initiateAuthforestLogin,
        logout
      }}
    >
      {props.children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
