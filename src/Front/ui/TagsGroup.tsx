import clsx from 'clsx';

import { SVGIconProps } from '../types';
import { CloseIcon } from '../icons';

import Tag from './Tag';

interface TagsGroupProps<T> {
  isOpen: boolean;
  toggleVisibility: () => void;
  closeText?: string;
  openText?: string;
  className?: string;
  listClassName?: string;
  OpenIcon: React.FC<SVGIconProps>;
  items: T[];
  renderItem: (item: T, toggleMenuOpen: () => void) => React.ReactNode;
  ariaLabel?: string;
}

const TagsGroup = <T,>({
  isOpen,
  toggleVisibility,
  openText,
  closeText,
  OpenIcon,
  className,
  listClassName,
  items,
  renderItem,
  ariaLabel,
}: TagsGroupProps<T>) => {
  return (
    <div>
      <Tag
        href={toggleVisibility}
        className={clsx(className, isOpen && 'bg-gray-90 !border-black-100 text-white-00')}
        ariaLabel={ariaLabel}
      >
        <>
          {isOpen ? openText : closeText}
          {isOpen ? <CloseIcon size={20} /> : <OpenIcon size={20} />}
        </>
      </Tag>
      <div
        className={clsx(
          'mt-2.5 absolute flex flex-col space-y-2.5',
          !isOpen && 'invisible',
          listClassName
        )}
      >
        {items.map((item) => renderItem(item, toggleVisibility))}
      </div>
    </div>
  );
};

export default TagsGroup;
