import clsx from 'clsx';
import { useMemo } from 'react';

type TagProps = {
  children: string | React.ReactNode;
  href: string | (() => void);
  className?: string;
  ariaLabel?: string;
};

const Tag = ({ children, href, className, ariaLabel }: TagProps) => {
  const ChildrenContent = useMemo(() => {
    if (typeof children === 'string') {
      return <label className="cursor-pointer truncate topic">{children}</label>;
    }

    return children;
  }, [children]);

  const tagClassName = useMemo(
    () =>
      clsx(
        'focus-dark-green rounded-tag py-2 px-4 text-xs flex items-center justify-center bg-gray-30 border-gray-50 border rounded-tag text-center body-s truncate',
        className
      ),
    [className]
  );

  if (typeof href === 'string') {
    return (
      <a href={href} className={tagClassName} aria-label={ariaLabel}>
        {ChildrenContent}
      </a>
    );
  }

  return (
    <button onClick={href} className={tagClassName} aria-label={ariaLabel || 'Go to the tag'}>
      {ChildrenContent}
    </button>
  );
};

export default Tag;
