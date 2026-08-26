"use client";

import { useEffect, useState, type FormEvent } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Input";

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
      <p className="text-sm text-muted">Tell us how you&apos;d like to receive commission payments.</p>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-4 text-sm">
            {(["ZELLE", "VENMO", "CHECK"] as const).map((m) => (
              <label key={m} className="flex items-center gap-1.5">
                <input
                  type="radio"
                  name="method"
                  checked={method === m}
                  onChange={() => setMethod(m)}
                  className="accent-primary"
                />
                {m === "ZELLE" ? "Zelle" : m === "VENMO" ? "Venmo" : "Check by mail"}
              </label>
            ))}
          </div>

          {method === "ZELLE" && (
            <Input
              value={zelleContact}
              onChange={(e) => setZelleContact(e.target.value)}
              placeholder="Zelle email or phone number"
              required
            />
          )}
          {method === "VENMO" && (
            <Input
              value={venmoUsername}
              onChange={(e) => setVenmoUsername(e.target.value)}
              placeholder="Venmo username (e.g. @your-name)"
              required
            />
          )}
          {method === "CHECK" && (
            <Textarea
              value={checkAddress}
              onChange={(e) => setCheckAddress(e.target.value)}
              placeholder="Mailing address"
              required
              rows={3}
            />
          )}

          <Button type="submit">Save</Button>
          {saved && <p className="text-sm text-success">Saved.</p>}
        </form>
      </Card>
    </main>
  );
}
