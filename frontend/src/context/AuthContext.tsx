import { createContext, useContext, createSignal, JSX, onMount } from 'solid-js';
import { UserManager, WebStorageStateStore, User as OidcUser } from 'oidc-client-ts';
import { User, Tenant, Role } from '../types';
import { apiClient } from '../api/client';

export function getOidcUserManager(issuer: string, clientId: string): UserManager {
  const authority = issuer.replace(/\/$/, '');
  return new UserManager({
    authority,
    client_id: clientId,
    redirect_uri: window.location.origin,
    response_type: 'code',
    scope: 'openid profile email',
    userStore: new WebStorageStateStore({ store: window.sessionStorage }),
    loadUserInfo: true
  });
}

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

  const applyOidcUser = (oidcUser: OidcUser) => {
    const profile = oidcUser.profile;
    const roleClaim = (profile['role'] as string | undefined) || 
      ((profile['roles'] as string[] | undefined)?.[0]) || 
      'STORE_ADMIN';

    const cleanRole: Role = roleClaim.toUpperCase().includes('SUPER')
      ? 'SUPER_ADMIN'
      : (roleClaim.toUpperCase().includes('ADMIN') || roleClaim.toUpperCase().includes('OWNER') ? 'STORE_ADMIN' : 'CASHIER');

    const appUser: User = {
      id: oidcUser.profile.sub,
      tenantId: (profile['tenant_id'] as string | undefined) || 'a0000000-0000-0000-0000-000000000001',
      username: (profile['preferred_username'] as string | undefined) || profile.email || oidcUser.profile.sub,
      fullName: profile.name || (profile['preferred_username'] as string | undefined) || 'AuthForest User',
      email: profile.email,
      role: cleanRole,
      isActive: true
    };

    loginWithToken(oidcUser.access_token, appUser);
  };

  onMount(async () => {
    // 1. Fetch default tenant data
    const t = await apiClient.getTenant('a0000000-0000-0000-0000-000000000001');
    setTenant(t);

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('code')) {
      // 2. Standard OIDC signinCallback using oidc-client-ts UserManager
      try {
        const mgr = getOidcUserManager(oidcIssuer(), oidcClientId());
        const oidcUser = await mgr.signinCallback();
        if (oidcUser) {
          applyOidcUser(oidcUser);
        }
      } catch (err) {
        console.error('OIDC signinCallback failed:', err);
      } finally {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } else {
      // 3. Check for existing active OIDC session in sessionStorage
      try {
        const mgr = getOidcUserManager(oidcIssuer(), oidcClientId());
        const existingOidcUser = await mgr.getUser();
        if (existingOidcUser && !existingOidcUser.expired) {
          applyOidcUser(existingOidcUser);
        }
      } catch (_) {}
    }
  });

  // Standard OIDC signinRedirect using oidc-client-ts UserManager
  const initiateAuthforestLogin = async () => {
    const mgr = getOidcUserManager(oidcIssuer(), oidcClientId());
    await mgr.signinRedirect();
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

  const logout = async () => {
    sessionStorage.removeItem('billease_token');
    sessionStorage.removeItem('billease_user');
    try {
      const mgr = getOidcUserManager(oidcIssuer(), oidcClientId());
      await mgr.removeUser();
    } catch (_) {}
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
