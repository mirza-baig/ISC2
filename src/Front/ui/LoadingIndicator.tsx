import clsx from 'clsx';

interface LoadingIndicatorProps {
  className?: string;
}

export default function LoadingIndicator({ className }: LoadingIndicatorProps) {
  return (
    <div role="status" aria-label="Loading" className={clsx('py-8', className)}>
      <svg
        className="animate-spin text-current"
        width="40"
        height="40"
        viewBox="0 0 40 40"
        fill="none"
        aria-hidden
      >
        <circle
          cx="20"
          cy="20"
          r="16"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="32 80"
          strokeDashoffset="0"
        />
      </svg>
    </div>
  );
}
