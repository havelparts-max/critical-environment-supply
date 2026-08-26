"use client";

import { useEffect, useState, type FormEvent } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Select } from "@/components/ui/Input";
import StatusBadge from "@/components/ui/StatusBadge";

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
      <div>
        <h1 className="text-xl font-semibold">Staff</h1>

        {newPassword && (
          <div className="mt-3 rounded-lg bg-success/10 p-3 text-sm">
            <p>
              New password for <strong>{newPassword.email}</strong>:{" "}
              <code className="rounded bg-muted-bg px-1.5 py-0.5">{newPassword.password}</code>
            </p>
            <p className="mt-1 text-xs text-muted">
              Save this now - it won&apos;t be shown again. Share it with them directly.
            </p>
            <button onClick={() => setNewPassword(null)} className="mt-2 text-xs underline">
              Dismiss
            </button>
          </div>
        )}
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold">Add staff member</h2>
        <form onSubmit={handleCreate} className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <Input name="name" placeholder="Name" required />
          <Input name="email" type="email" placeholder="Email" required />
          <Select name="role" defaultValue="SALES" className="col-span-2">
            <option value="SALES">Sales</option>
            <option value="ADMIN">Admin</option>
          </Select>
          <Button type="submit" className="col-span-2">
            Create account
          </Button>
        </form>
        {createError && <p className="mt-2 text-sm text-destructive">{createError}</p>}
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b border-border p-6 pb-4">
          <h2 className="text-lg font-semibold">All staff ({users.length})</h2>
          {rowError && <p className="mt-2 text-sm text-destructive">{rowError}</p>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-muted">
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Email</th>
                <th className="px-4 py-2 font-medium">Role</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-2">{u.name}</td>
                  <td className="px-4 py-2 text-muted">{u.email}</td>
                  <td className="px-4 py-2">
                    <Select
                      value={u.role}
                      onChange={(e) => updateUser(u.id, { role: e.target.value as "ADMIN" | "SALES" })}
                      className="w-auto py-1"
                    >
                      <option value="SALES">Sales</option>
                      <option value="ADMIN">Admin</option>
                    </Select>
                  </td>
                  <td className="px-4 py-2">
                    <StatusBadge status={u.active ? "ACTIVE" : "DEACTIVATED"} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-2">
                    <Button variant="outline" size="sm" onClick={() => updateUser(u.id, { active: !u.active })} className="mr-2">
                      {u.active ? "Deactivate" : "Reactivate"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => resetPassword(u.id, u.email)}>
                      Reset password
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </main>
  );
}
