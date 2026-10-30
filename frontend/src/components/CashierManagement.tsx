import { Component, createSignal, createEffect, For, Show } from "solid-js";
import { useAuth } from "../context/AuthContext";
import { apiClient } from "../api/client";
import { User, UserCreateInput, Role } from "../types";
import {
  Users,
  UserPlus,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Phone,
  Mail,
  Lock,
  UserCheck,
  Search,
  RefreshCw,
} from "lucide-solid";

export const CashierManagement: Component = () => {
  const { tenant, token, isStoreAdmin, isSuperAdmin } = useAuth();

  const [users, setUsers] = createSignal<User[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [searchQuery, setSearchQuery] = createSignal("");
  const [showAddModal, setShowAddModal] = createSignal(false);
  const [submitting, setSubmitting] = createSignal(false);
  const [errorMessage, setErrorMessage] = createSignal<string | null>(null);

  // Form State
  const [username, setUsername] = createSignal("");
  const [fullName, setFullName] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [phone, setPhone] = createSignal("");
  const [email, setEmail] = createSignal("");
  const [selectedRole, setSelectedRole] = createSignal<Role>("CASHIER");

  const loadUsers = async () => {
    const t = tenant();
    if (!t) return;
    setLoading(true);
    try {
      const data = await apiClient.listUsers(t.id, token());
      setUsers(data);
    } catch (_) {
      // Fallback or error handled inside client
    } finally {
      setLoading(false);
    }
  };

  createEffect(() => {
    const t = tenant();
    if (t) {
      loadUsers();
    }
  });

  const handleToggleStatus = async (user: User) => {
    const t = tenant();
    if (!t) return;
    const confirmMsg = user.isActive
      ? `Are you sure you want to deactivate cashier "${user.fullName}"? They will not be able to log in.`
      : `Re-activate cashier "${user.fullName}"?`;
    if (!confirm(confirmMsg)) return;

    try {
      const updated = await apiClient.toggleUserActive(t.id, user.id, token());
      if (updated) {
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, isActive: updated.isActive } : u))
        );
      } else {
        // Toggle locally if backend returns mock/null
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, isActive: !u.isActive } : u))
        );
      }
    } catch (err) {
      alert("Failed to update status. Please try again.");
    }
  };

  const handleCreateUser = async (e: Event) => {
    e.preventDefault();
    const t = tenant();
    if (!t) return;

    if (!username().trim() || !fullName().trim() || !password().trim()) {
      setErrorMessage("Username, Full Name, and Password are required.");
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    const input: UserCreateInput = {
      tenantId: t.id,
      username: username().trim().toLowerCase(),
      fullName: fullName().trim(),
      password: password().trim(),
      phone: phone().trim() || undefined,
      email: email().trim() || undefined,
      role: selectedRole(),
    };

    try {
      const newUser = await apiClient.createUser(t.id, token(), input);
      if (newUser) {
        setUsers((prev) => [...prev, newUser]);
        setShowAddModal(false);
        // Reset form
        setUsername("");
        setFullName("");
        setPassword("");
        setPhone("");
        setEmail("");
        setSelectedRole("CASHIER");
      } else {
        setErrorMessage("Failed to create cashier. Username may already exist.");
      }
    } catch (err) {
      setErrorMessage("An unexpected error occurred while creating cashier.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredUsers = () => {
    const q = searchQuery().toLowerCase().trim();
    if (!q) return users();
    return users().filter(
      (u) =>
        u.fullName.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        (u.phone && u.phone.includes(q))
    );
  };

  return (
    <div class="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div class="bg-gradient-to-r from-slate-900 to-emerald-950 text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/30 text-emerald-300 border border-emerald-400/30">
              Counter Staff
            </span>
            <span class="text-xs text-slate-400">
              Store: <strong class="text-white">{tenant()?.name}</strong>
            </span>
          </div>
          <h2 class="text-2xl font-black mt-1 flex items-center gap-2">
            <Users class="w-6 h-6 text-emerald-400" />
            Cashier & Staff Management
          </h2>
          <p class="text-xs text-slate-300 mt-1 max-w-xl">
            Add counter cashiers, grant POS terminal access, or deactivate staff credentials when their shift or contract ends.
          </p>
        </div>

        <button
          onClick={() => {
            setErrorMessage(null);
            setShowAddModal(true);
          }}
          class="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md flex items-center gap-2 shrink-0"
        >
          <UserPlus class="w-4 h-4" />
          Add New Cashier
        </button>
      </div>

      {/* KPI Counters */}
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-400">
            Total Staff Accounts
          </span>
          <p class="text-2xl font-black text-slate-900 mt-1">{users().length}</p>
        </div>
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-400">
            Active Cashiers
          </span>
          <p class="text-2xl font-black text-emerald-600 mt-1">
            {users().filter((u) => u.isActive && u.role === "CASHIER").length}
          </p>
        </div>
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-400">
            Deactivated / Inactive
          </span>
          <p class="text-2xl font-black text-rose-600 mt-1">
            {users().filter((u) => !u.isActive).length}
          </p>
        </div>
      </div>

      {/* Search & Actions Bar */}
      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div class="relative w-full sm:w-80">
          <Search class="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, username, or phone..."
            value={searchQuery()}
            onInput={(e) => setSearchQuery(e.currentTarget.value)}
            class="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
          />
        </div>
        <button
          onClick={loadUsers}
          class="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <RefreshCw class={`w-3.5 h-3.5 ${loading() ? "animate-spin" : ""}`} />
          Refresh List
        </button>
      </div>

      {/* Staff Table */}
      <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div class="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 class="text-xs font-bold uppercase tracking-wider text-slate-700">
            Store Staff Roster
          </h3>
          <span class="text-xs text-slate-400 font-medium">
            Showing {filteredUsers().length} staff members
          </span>
        </div>

        <Show
          when={!loading()}
          fallback={
            <div class="p-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
              <RefreshCw class="w-6 h-6 animate-spin text-emerald-600" />
              <span>Loading staff roster...</span>
            </div>
          }
        >
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[11px] border-b border-slate-100">
                <tr>
                  <th class="px-5 py-3">Staff Member</th>
                  <th class="px-4 py-3">Username</th>
                  <th class="px-4 py-3">Role</th>
                  <th class="px-4 py-3">Contact</th>
                  <th class="px-4 py-3">Status</th>
                  <th class="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <For
                  each={filteredUsers()}
                  fallback={
                    <tr>
                      <td colspan="6" class="px-5 py-8 text-center text-slate-400">
                        No staff members found matching your search.
                      </td>
                    </tr>
                  }
                >
                  {(u) => (
                    <tr class="hover:bg-slate-50/80 transition-colors">
                      <td class="px-5 py-3.5">
                        <div class="flex items-center gap-3">
                          <div class="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-xs">
                            {u.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p class="font-bold text-slate-900">{u.fullName}</p>
                            <p class="text-[11px] text-slate-400 font-mono">ID: {u.id.substring(0, 8)}...</p>
                          </div>
                        </div>
                      </td>
                      <td class="px-4 py-3.5 font-mono text-slate-700 font-medium">
                        @{u.username}
                      </td>
                      <td class="px-4 py-3.5">
                        <span
                          class={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            u.role === "STORE_ADMIN"
                              ? "bg-purple-100 text-purple-700"
                              : u.role === "MANAGER"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {u.role === "STORE_ADMIN"
                            ? "Store Owner"
                            : u.role === "MANAGER"
                            ? "Store Manager"
                            : "Counter Cashier"}
                        </span>
                      </td>
                      <td class="px-4 py-3.5 text-slate-600">
                        <div class="space-y-0.5">
                          {u.phone && (
                            <div class="flex items-center gap-1.5">
                              <Phone class="w-3 h-3 text-slate-400" />
                              <span>{u.phone}</span>
                            </div>
                          )}
                          {u.email && (
                            <div class="flex items-center gap-1.5 text-slate-400">
                              <Mail class="w-3 h-3" />
                              <span class="truncate max-w-[140px]">{u.email}</span>
                            </div>
                          )}
                          {!u.phone && !u.email && <span class="text-slate-400">—</span>}
                        </div>
                      </td>
                      <td class="px-4 py-3.5">
                        <Show
                          when={u.isActive}
                          fallback={
                            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <XCircle class="w-3 h-3" /> Deactivated
                            </span>
                          }
                        >
                          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 class="w-3 h-3" /> Active
                          </span>
                        </Show>
                      </td>
                      <td class="px-5 py-3.5 text-right">
                        <button
                          onClick={() => handleToggleStatus(u)}
                          disabled={u.role === "STORE_ADMIN" && isStoreAdmin() && !isSuperAdmin()}
                          class={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                            u.isActive
                              ? "text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200"
                              : "text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200"
                          } disabled:opacity-40 disabled:cursor-not-allowed`}
                        >
                          {u.isActive ? "Deactivate" : "Re-activate"}
                        </button>
                      </td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </div>
        </Show>
      </div>

      {/* Add Cashier Modal */}
      <Show when={showAddModal()}>
        <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div class="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 class="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserCheck class="w-5 h-5 text-emerald-600" />
                Add New Counter Cashier
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                class="text-slate-400 hover:text-slate-600 font-bold p-1"
              >
                ✕
              </button>
            </div>

            <Show when={errorMessage()}>
              <div class="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <ShieldAlert class="w-4 h-4 shrink-0" />
                <span>{errorMessage()}</span>
              </div>
            </Show>

            <form onSubmit={handleCreateUser} class="space-y-3.5 text-xs">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={fullName()}
                  onInput={(e) => setFullName(e.currentTarget.value)}
                  class="w-full p-2.5 rounded-lg border border-slate-200 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">
                  Login Username * (for POS Sign-in)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ramesh_cashier"
                  value={username()}
                  onInput={(e) => setUsername(e.currentTarget.value)}
                  class="w-full p-2.5 rounded-lg border border-slate-200 font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">Login Password *</label>
                <div class="relative">
                  <Lock class="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="Create a secure cashier password"
                    value={password()}
                    onInput={(e) => setPassword(e.currentTarget.value)}
                    class="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Mobile / Phone</label>
                  <input
                    type="tel"
                    placeholder="e.g. 9822012345"
                    value={phone()}
                    onInput={(e) => setPhone(e.currentTarget.value)}
                    class="w-full p-2.5 rounded-lg border border-slate-200 font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Role Permission</label>
                  <select
                    value={selectedRole()}
                    onChange={(e) => setSelectedRole(e.currentTarget.value as Role)}
                    class="w-full p-2.5 rounded-lg border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="CASHIER">Cashier (POS Only)</option>
                    <option value="MANAGER">Store Manager</option>
                  </select>
                </div>
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">Email Address (Optional)</label>
                <input
                  type="email"
                  placeholder="e.g. ramesh@gmail.com"
                  value={email()}
                  onInput={(e) => setEmail(e.currentTarget.value)}
                  class="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  class="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting()}
                  class="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors shadow-xs disabled:opacity-50"
                >
                  {submitting() ? "Creating..." : "Add Cashier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Show>
    </div>
  );
};

