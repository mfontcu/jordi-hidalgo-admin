import { cn } from '@/shared/lib/cn';

type SpinnerProps = {
  /** Size in px. Buttons use 18, like the Flutter panel's CircularProgressIndicator. */
  size?: number;
  className?: string;
};

/** Indeterminate circular progress, drawn in the current text color (Material stroke of 2px). */
export function Spinner({ size = 18, className }: SpinnerProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      aria-hidden
      className={cn('shrink-0 animate-spin', className)}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="2.67"
        strokeLinecap="round"
        strokeDasharray="47 63"
      />
    </svg>
  );
}
