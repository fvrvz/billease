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
}

const AuthContext = createContext<AuthContextType>();

export function AuthProvider(props: { children: JSX.Element }) {
  const [user, setUser] = createSignal<User | null>({
    id: 'b0000000-0000-0000-0000-000000000002',
    tenantId: 'a0000000-0000-0000-0000-000000000001',
    username: 'ganesh_owner',
    fullName: 'Ganesh Patil (Owner)',
    role: 'STORE_ADMIN',
    isActive: true
  });

  const [tenant, setTenant] = createSignal<Tenant | null>(null);
  const [token, setToken] = createSignal<string>('owner-token');

  onMount(async () => {
    const t = await apiClient.getTenant('a0000000-0000-0000-0000-000000000001');
    setTenant(t);
  });

  const isSuperAdmin = () => user()?.role === 'SUPER_ADMIN';
  const isStoreAdmin = () => user()?.role === 'STORE_ADMIN';
  const isCashier = () => user()?.role === 'CASHIER';

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
        updateTenantData
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
