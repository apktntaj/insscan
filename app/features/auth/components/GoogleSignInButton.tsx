import { signInWithGoogle } from "@/app/features/auth/actions/auth.actions";
import { Button } from "@/components/ui/button";

export default function GoogleSignInButton() {
  return (
    <form action={signInWithGoogle}>
      <Button
        type="submit"
        variant="outline"
        size="lg"
        className="w-full"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" data-icon="inline-start">
          <path fill="#4285F4" d="M21.35 12.2c0-.72-.06-1.24-.2-1.78H12v3.25h5.37a4.58 4.58 0 0 1-1.99 3.01l-.02.11 2.89 2.24.2.02c1.82-1.68 2.9-4.15 2.9-6.85Z" />
          <path fill="#34A853" d="M12 21.75c2.61 0 4.8-.86 6.4-2.7l-3.04-2.36c-.81.55-1.9.94-3.36.94a5.82 5.82 0 0 1-5.5-4.02l-.1.01-3 2.33-.04.1A9.67 9.67 0 0 0 12 21.75Z" />
          <path fill="#FBBC05" d="M6.5 13.61A5.94 5.94 0 0 1 6.18 12c0-.56.11-1.1.3-1.61v-.1L3.45 7.91l-.1.05A9.72 9.72 0 0 0 2.31 12c0 1.45.37 2.82 1.04 4.04l3.15-2.43Z" />
          <path fill="#EA4335" d="M12 6.37c1.82 0 3.05.79 3.75 1.43l2.71-2.65A9.2 9.2 0 0 0 12 2.25a9.67 9.67 0 0 0-8.65 5.71l3.13 2.43A5.84 5.84 0 0 1 12 6.37Z" />
        </svg>
        Lanjutkan dengan Google
      </Button>
    </form>
  );
}
