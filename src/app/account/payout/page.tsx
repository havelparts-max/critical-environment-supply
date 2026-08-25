"use client";

import { useEffect, useState, type FormEvent } from "react";

type Method = "ZELLE" | "VENMO" | "CHECK";

export default function PayoutProfilePage() {
  const [method, setMethod] = useState<Method>("ZELLE");
  const [zelleContact, setZelleContact] = useState("");
  const [venmoUsername, setVenmoUsername] = useState("");
  const [checkAddress, setCheckAddress] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/account/payout")
      .then((res) => res.json())
      .then((data) => {
        if (data.profile) {
          setMethod(data.profile.method);
          setZelleContact(data.profile.zelleContact ?? "");
          setVenmoUsername(data.profile.venmoUsername ?? "");
          setCheckAddress(data.profile.checkAddress ?? "");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaved(false);

    const payload =
      method === "ZELLE"
        ? { method, zelleContact }
        : method === "VENMO"
          ? { method, venmoUsername }
          : { method, checkAddress };

    const res = await fetch("/api/account/payout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) setSaved(true);
  }

  if (loading) return null;

  return (
    <main className="mx-auto max-w-md space-y-4 p-6">
      <h1 className="text-xl font-semibold">Commission payout info</h1>
      <p className="text-sm text-black/60 dark:text-white/60">
        Tell us how you&apos;d like to receive commission payments.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-4 text-sm">
          {(["ZELLE", "VENMO", "CHECK"] as const).map((m) => (
            <label key={m} className="flex items-center gap-1">
              <input type="radio" name="method" checked={method === m} onChange={() => setMethod(m)} />
              {m === "ZELLE" ? "Zelle" : m === "VENMO" ? "Venmo" : "Check by mail"}
            </label>
          ))}
        </div>

        {method === "ZELLE" && (
          <input
            value={zelleContact}
            onChange={(e) => setZelleContact(e.target.value)}
            placeholder="Zelle email or phone number"
            required
            className="w-full rounded border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/20"
          />
        )}
        {method === "VENMO" && (
          <input
            value={venmoUsername}
            onChange={(e) => setVenmoUsername(e.target.value)}
            placeholder="Venmo username (e.g. @your-name)"
            required
            className="w-full rounded border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/20"
          />
        )}
        {method === "CHECK" && (
          <textarea
            value={checkAddress}
            onChange={(e) => setCheckAddress(e.target.value)}
            placeholder="Mailing address"
            required
            rows={3}
            className="w-full rounded border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/20"
          />
        )}

        <button
          type="submit"
          className="rounded bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
        >
          Save
        </button>
        {saved && <p className="text-sm text-green-700 dark:text-green-400">Saved.</p>}
      </form>
    </main>
  );
}
