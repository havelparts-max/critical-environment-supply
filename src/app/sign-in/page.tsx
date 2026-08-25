import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";

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
    <main className="flex flex-1 items-center justify-center p-6">
      <form
        action={handleSignIn}
        className="w-full max-w-sm space-y-4 rounded-lg border border-black/10 p-6 dark:border-white/10"
      >
        <h1 className="text-xl font-semibold">Sign in</h1>
        {hasError && (
          <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            Invalid email or password.
          </p>
        )}
        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="username"
            className="w-full rounded border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/20"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full rounded border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/20"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded bg-black px-3 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
        >
          Sign in
        </button>
      </form>
    </main>
  );
}
