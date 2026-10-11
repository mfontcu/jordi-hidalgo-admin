import { Spinner } from '@/shared/ui';

/** auth_gate_screen.dart: a centered 28px spinner while the stored session is restored. */
export function SessionRestoringScreen() {
  return (
    <div
      role="status"
      aria-busy
      className="flex min-h-dvh items-center justify-center bg-background text-primary"
    >
      <Spinner size={28} />
    </div>
  );
}
