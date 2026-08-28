import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import Card from "@/components/ui/Card";
import { buttonVariants } from "@/components/ui/Button";

async function getProduct(sku: string) {
  return prisma.product.findFirst({ where: { sku, active: true } });
}

export async function generateMetadata({ params }: PageProps<"/product/[sku]">): Promise<Metadata> {
  const { sku } = await params;
  const product = await getProduct(decodeURIComponent(sku));
  if (!product) return { title: "Product not found — Critical Environment Supply" };
  return {
    title: `${product.name} — Critical Environment Supply`,
    description: product.description ?? `${product.name} (${product.sku}) — HVAC parts and controls.`,
  };
}

export default async function ProductPage({ params }: PageProps<"/product/[sku]">) {
  const { sku } = await params;
  const product = await getProduct(decodeURIComponent(sku));
  if (!product) notFound();

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <Link href="/" className="text-sm text-muted transition-colors hover:text-foreground">
          &larr; Back to home
        </Link>
      </div>

      <Card className="grid gap-6 p-6 sm:grid-cols-[200px_1fr]">
        <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-muted-bg">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              width={400}
              height={400}
              className="h-full w-full object-contain"
              unoptimized
            />
          ) : (
            <span className="text-xs text-muted">No image available</span>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <h1 className="text-xl font-semibold">{product.name}</h1>
            <p className="mt-1 text-sm text-muted">
              SKU: {product.sku}
              {product.vendor ? ` · ${product.vendor}` : ""}
            </p>
          </div>

          {product.description && (
            <p className="text-sm leading-relaxed text-muted">{product.description}</p>
          )}

          <div className="text-2xl font-semibold">${product.price.toString()}</div>

          <Link
            href={`/?q=${encodeURIComponent(product.sku)}`}
            className={buttonVariants({ size: "md" }) + " px-6 py-3 text-base"}
          >
            Order this item
          </Link>
        </div>
      </Card>
    </main>
  );
}
