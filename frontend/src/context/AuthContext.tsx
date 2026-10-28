import { createContext, useContext, createSignal, JSX, onMount } from 'solid-js';
import { UserManager, WebStorageStateStore, User as OidcUser } from 'oidc-client-ts';
import { User, Tenant, Role } from '../types';
import { apiClient } from '../api/client';

// Generic OIDC UserManager factory — works with any OIDC-compliant IdP
export function createOidcUserManager(issuerUrl: string, clientId: string): UserManager {
  const authority = issuerUrl.replace(/\/$/, '');
  return new UserManager({
    authority,
    client_id: clientId,
    redirect_uri: window.location.origin,
    response_type: 'code',
    scope: 'openid profile email',
    userStore: new WebStorageStateStore({ store: window.sessionStorage }),
    loadUserInfo: true,
  });
}

interface OidcConfig {
  issuerUrl: string;
  clientId: string;
}

interface AuthContextType {
  user: () => User | null;
  tenant: () => Tenant | null;
  token: () => string;
  isAuthenticated: () => boolean;
  isSuperAdmin: () => boolean;
  isStoreAdmin: () => boolean;
  isCashier: () => boolean;
  oidcConfig: () => OidcConfig;
  setOidcConfig: (cfg: OidcConfig) => void;
  loginWithCredentials: (username: string, password: string) => Promise<string | null>;
  loginWithOidcRedirect: () => Promise<void>;
  logout: () => Promise<void>;
  updateTenantData: (updates: Partial<Tenant>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>();

function mapOidcUserToAppUser(oidcUser: OidcUser): User {
  const profile = oidcUser.profile;
  const roleClaim =
    (profile['role'] as string | undefined) ||
    ((profile['roles'] as string[] | undefined)?.[0]) ||
    'CASHIER';

  const normalized = roleClaim.toUpperCase();
  const role: Role = normalized.includes('SUPER')
    ? 'SUPER_ADMIN'
    : normalized.includes('ADMIN') || normalized.includes('OWNER')
    ? 'STORE_ADMIN'
    : 'CASHIER';

  return {
    id: profile.sub,
    tenantId: (profile['tenant_id'] as string | undefined) || undefined,
    username: (profile['preferred_username'] as string | undefined) || profile.email || profile.sub,
    fullName: profile.name || (profile['preferred_username'] as string | undefined) || 'SSO User',
    email: profile.email,
    role,
    isActive: true,
  };
}

export function AuthProvider(props: { children: JSX.Element }) {
  const [user, setUser] = createSignal<User | null>(null);
  const [tenant, setTenant] = createSignal<Tenant | null>(null);
  const [token, setToken] = createSignal<string>('');

  const [oidcConfig, setOidcConfig] = createSignal<OidcConfig>({
    issuerUrl: sessionStorage.getItem('oidc_issuer') || 'http://localhost:8080',
    clientId: sessionStorage.getItem('oidc_client_id') || 'billease-web',
  });

  const persistSession = (t: string, u: User) => {
    setToken(t);
    setUser(u);
    sessionStorage.setItem('billease_token', t);
    sessionStorage.setItem('billease_user', JSON.stringify(u));
  };

  const isAuthenticated = () => user() !== null && token() !== '';

  onMount(async () => {
    const urlParams = new URLSearchParams(window.location.search);

    if (urlParams.has('code')) {
      // OIDC Authorization Code callback — let oidc-client-ts handle it
      const cfg = oidcConfig();
      try {
        const mgr = createOidcUserManager(cfg.issuerUrl, cfg.clientId);
        const oidcUser = await mgr.signinCallback();
        if (oidcUser) {
          const appUser = mapOidcUserToAppUser(oidcUser);
          persistSession(oidcUser.access_token, appUser);
        }
      } catch (err) {
        console.error('[OIDC] signinCallback failed:', err);
      } finally {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } else {
      // Restore existing session from sessionStorage
      const savedToken = sessionStorage.getItem('billease_token');
      const savedUserRaw = sessionStorage.getItem('billease_user');
      if (savedToken && savedUserRaw) {
        try {
          const savedUser = JSON.parse(savedUserRaw) as User;
          setToken(savedToken);
          setUser(savedUser);
        } catch {
          // corrupted — ignore, stay logged out
        }
      } else {
        // Try restoring live OIDC session
        const cfg = oidcConfig();
        try {
          const mgr = createOidcUserManager(cfg.issuerUrl, cfg.clientId);
          const oidcUser = await mgr.getUser();
          if (oidcUser && !oidcUser.expired) {
            const appUser = mapOidcUserToAppUser(oidcUser);
            persistSession(oidcUser.access_token, appUser);
          }
        } catch {
          // no valid OIDC session
        }
      }
    }

    // Load tenant after user is resolved
    const currentUser = user();
    if (currentUser?.tenantId) {
      const t = await apiClient.getTenant(currentUser.tenantId);
      setTenant(t);
    } else if (!currentUser?.tenantId) {
      // Fallback: load default demo tenant for presentation
      const t = await apiClient.getTenant('a0000000-0000-0000-0000-000000000001');
      setTenant(t);
    }
  });

  const loginWithCredentials = async (username: string, password: string): Promise<string | null> => {
    const result = await apiClient.login(username, password);
    if (!result) return 'Invalid username or password';
    persistSession(result.token, {
      id: result.user.id,
      tenantId: result.user.tenantId?.toString(),
      username: result.user.username,
      fullName: result.user.fullName,
      email: result.user.email,
      role: result.user.role as Role,
      isActive: result.user.isActive,
    });
    if (result.tenant) setTenant(result.tenant as unknown as Tenant);
    return null;
  };

  const loginWithOidcRedirect = async (): Promise<void> => {
    const cfg = oidcConfig();
    const mgr = createOidcUserManager(cfg.issuerUrl, cfg.clientId);
    await mgr.signinRedirect();
  };

  const logout = async (): Promise<void> => {
    sessionStorage.removeItem('billease_token');
    sessionStorage.removeItem('billease_user');
    const cfg = oidcConfig();
    try {
      const mgr = createOidcUserManager(cfg.issuerUrl, cfg.clientId);
      await mgr.removeUser();
    } catch {
      // ignore
    }
    setUser(null);
    setToken('');
    setTenant(null);
  };

  const handleSetOidcConfig = (cfg: OidcConfig) => {
    setOidcConfig(cfg);
    sessionStorage.setItem('oidc_issuer', cfg.issuerUrl);
    sessionStorage.setItem('oidc_client_id', cfg.clientId);
  };

  const isSuperAdmin = () => user()?.role === 'SUPER_ADMIN';
  const isStoreAdmin = () => user()?.role === 'STORE_ADMIN';
  const isCashier = () => user()?.role === 'CASHIER';

  const updateTenantData = async (updates: Partial<Tenant>): Promise<void> => {
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
        isAuthenticated,
        isSuperAdmin,
        isStoreAdmin,
        isCashier,
        oidcConfig,
        setOidcConfig: handleSetOidcConfig,
        loginWithCredentials,
        loginWithOidcRedirect,
        logout,
        updateTenantData,
      }}
    >
      {props.children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
