import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default async function SignInPage({
  searchParams,
}: PageProps<"/sign-in">) {
  const params = await searchParams;
  const hasError = typeof params.error === "string";

  async function handleSignIn(formData: FormData) {
    "use server";
    const email = formData.get("email");
    const password = formData.get("password");
    try {
      await signIn("credentials", { email, password, redirect: false });
    } catch (error) {
      if (error instanceof AuthError) {
        redirect("/sign-in?error=1");
      }
      throw error;
    }
    redirect("/orders");
  }

  return (
    <main className="flex flex-1 items-center justify-center bg-gradient-to-b from-primary/5 to-transparent p-6">
      <Card className="w-full max-w-sm p-8">
        <div className="mb-6 text-center">
          <p className="text-sm font-semibold tracking-tight text-muted">Critical Environment Supply</p>
          <h1 className="mt-1 text-xl font-semibold">Staff sign in</h1>
        </div>
        <form action={handleSignIn} className="space-y-4">
          {hasError && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              Invalid email or password.
            </p>
          )}
          <div className="space-y-1">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input id="email" name="email" type="email" required autoComplete="username" />
          </div>
          <div className="space-y-1">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <Input id="password" name="password" type="password" required autoComplete="current-password" />
          </div>
          <Button type="submit" className="w-full">
            Sign in
          </Button>
        </form>
      </Card>
    </main>
  );
}
