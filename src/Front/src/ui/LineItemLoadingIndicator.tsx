import clsx from 'clsx';

import LoadingIndicator from './LoadingIndicator';

export default function LineItemLoadingIndicator({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        'absolute inset-0 bg-white-90 flex items-center justify-center select-none',
        className
      )}
    >
      <LoadingIndicator />
    </div>
  );
}
