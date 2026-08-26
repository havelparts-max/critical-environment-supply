import { redirect } from "next/navigation";
import { auth } from "@/auth";
import Storefront from "@/components/Storefront";

export default async function Home() {
  const session = await auth();
  if (session) redirect("/orders");
  return <Storefront />;
}
