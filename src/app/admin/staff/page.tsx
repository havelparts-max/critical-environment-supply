"use client";

import { useEffect, useState, type FormEvent } from "react";

interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "SALES";
  active: boolean;
  createdAt: string;
}

export default function StaffPage() {
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [newPassword, setNewPassword] = useState<{ email: string; password: string } | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch("/api/admin/staff");
    const data = await res.json();
    setUsers(data.users ?? []);
  }

  useEffect(() => {
    fetch("/api/admin/staff")
      .then((res) => res.json())
      .then((data) => setUsers(data.users ?? []));
  }, []);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreateError(null);
    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    const res = await fetch("/api/admin/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      setCreateError(typeof data.error === "string" ? data.error : JSON.stringify(data.error));
      return;
    }

    setNewPassword({ email: data.user.email, password: data.password });
    form.reset();
    await refresh();
  }

  async function updateUser(id: string, patch: Partial<Pick<StaffUser, "role" | "active">>) {
    setRowError(null);
    const res = await fetch(`/api/admin/staff/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = await res.json();
    if (!res.ok) {
      setRowError(typeof data.error === "string" ? data.error : JSON.stringify(data.error));
      return;
    }
    await refresh();
  }

  async function resetPassword(id: string, email: string) {
    const res = await fetch(`/api/admin/staff/${id}/reset-password`, { method: "POST" });
    const data = await res.json();
    if (res.ok) setNewPassword({ email, password: data.password });
  }

  return (
    <main className="mx-auto max-w-3xl space-y-8 p-6">
      <section>
        <h1 className="text-xl font-semibold">Staff</h1>

        {newPassword && (
          <div className="mt-3 rounded border border-green-600/30 bg-green-50 p-3 text-sm text-green-900 dark:bg-green-950 dark:text-green-300">
            <p>
              New password for <strong>{newPassword.email}</strong>:{" "}
              <code className="rounded bg-black/10 px-1.5 py-0.5 dark:bg-white/10">{newPassword.password}</code>
            </p>
            <p className="mt-1 text-xs">Save this now - it won&apos;t be shown again. Share it with them directly.</p>
            <button onClick={() => setNewPassword(null)} className="mt-2 text-xs underline">
              Dismiss
            </button>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold">Add staff member</h2>
        <form onSubmit={handleCreate} className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <input name="name" placeholder="Name" required className="rounded border border-black/15 bg-transparent px-2 py-1 dark:border-white/20" />
          <input name="email" type="email" placeholder="Email" required className="rounded border border-black/15 bg-transparent px-2 py-1 dark:border-white/20" />
          <select name="role" defaultValue="SALES" className="col-span-2 rounded border border-black/15 bg-transparent px-2 py-1 dark:border-white/20">
            <option value="SALES">Sales</option>
            <option value="ADMIN">Admin</option>
          </select>
          <button type="submit" className="col-span-2 rounded bg-black px-3 py-1.5 font-medium text-white dark:bg-white dark:text-black">
            Create account
          </button>
        </form>
        {createError && <p className="mt-2 text-sm text-red-700 dark:text-red-400">{createError}</p>}
      </section>

      <section>
        <h2 className="text-lg font-semibold">All staff ({users.length})</h2>
        {rowError && <p className="mt-2 text-sm text-red-700 dark:text-red-400">{rowError}</p>}
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-black/10 dark:border-white/10">
                <th className="py-1 pr-3">Name</th>
                <th className="py-1 pr-3">Email</th>
                <th className="py-1 pr-3">Role</th>
                <th className="py-1 pr-3">Status</th>
                <th className="py-1 pr-3" />
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-black/5 dark:border-white/5">
                  <td className="py-1 pr-3">{u.name}</td>
                  <td className="py-1 pr-3">{u.email}</td>
                  <td className="py-1 pr-3">
                    <select
                      value={u.role}
                      onChange={(e) => updateUser(u.id, { role: e.target.value as "ADMIN" | "SALES" })}
                      className="rounded border border-black/15 bg-transparent px-1 py-0.5 dark:border-white/20"
                    >
                      <option value="SALES">Sales</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </td>
                  <td className="py-1 pr-3">{u.active ? "Active" : "Deactivated"}</td>
                  <td className="py-1 pr-3 whitespace-nowrap">
                    <button
                      onClick={() => updateUser(u.id, { active: !u.active })}
                      className="mr-2 rounded bg-black px-2 py-1 text-xs font-medium text-white dark:bg-white dark:text-black"
                    >
                      {u.active ? "Deactivate" : "Reactivate"}
                    </button>
                    <button
                      onClick={() => resetPassword(u.id, u.email)}
                      className="rounded bg-black px-2 py-1 text-xs font-medium text-white dark:bg-white dark:text-black"
                    >
                      Reset password
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
