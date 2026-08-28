import { redirect } from "next/navigation";
import { auth } from "@/auth";
import Storefront from "@/components/Storefront";

export default async function Home({ searchParams }: PageProps<"/">) {
  const session = await auth();
  if (session) redirect("/orders");
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  return <Storefront initialQuery={q} />;
}
