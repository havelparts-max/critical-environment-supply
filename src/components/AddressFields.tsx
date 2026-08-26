"use client";

export interface Address {
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export const emptyAddress: Address = {
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "US",
};

export function addressComplete(address: Address) {
  return Boolean(
    address.line1.trim() && address.city.trim() && address.state.trim() && address.postalCode.trim(),
  );
}

export default function AddressFields({
  value,
  onChange,
  prefix,
}: {
  value: Address;
  onChange: (next: Address) => void;
  prefix: string;
}) {
  function set<K extends keyof Address>(key: K, val: Address[K]) {
    onChange({ ...value, [key]: val });
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <input
        value={value.line1}
        onChange={(e) => set("line1", e.target.value)}
        placeholder="Address line 1"
        aria-label={`${prefix} address line 1`}
        className="col-span-2 rounded border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/20"
      />
      <input
        value={value.line2}
        onChange={(e) => set("line2", e.target.value)}
        placeholder="Address line 2 (optional)"
        aria-label={`${prefix} address line 2`}
        className="col-span-2 rounded border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/20"
      />
      <input
        value={value.city}
        onChange={(e) => set("city", e.target.value)}
        placeholder="City"
        aria-label={`${prefix} city`}
        className="rounded border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/20"
      />
      <input
        value={value.state}
        onChange={(e) => set("state", e.target.value)}
        placeholder="State"
        aria-label={`${prefix} state`}
        className="rounded border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/20"
      />
      <input
        value={value.postalCode}
        onChange={(e) => set("postalCode", e.target.value)}
        placeholder="ZIP / postal code"
        aria-label={`${prefix} postal code`}
        className="rounded border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/20"
      />
      <input
        value={value.country}
        onChange={(e) => set("country", e.target.value.toUpperCase())}
        placeholder="Country (2-letter, e.g. US)"
        maxLength={2}
        aria-label={`${prefix} country`}
        className="rounded border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/20"
      />
    </div>
  );
}
