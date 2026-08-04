import clsx from 'clsx';
import { ProductDateGroup } from 'types/forms';

interface DateSelectorTabsProps {
  tabs?: ProductDateGroup[];
  activeTab: number;
  onActiveTabChange: (tabIndex: number) => void;
}

export default function DateSelectorTabs({
  tabs,
  activeTab,
  onActiveTabChange,
}: DateSelectorTabsProps) {
  return (
    <div className="flex overflow-x-auto space-x-3 my-3">
      {tabs?.map((tab, index) => (
        <button
          key={tab.key}
          className={clsx(
            'py-3 px-1 text-sm navigation border rounded-lg w-20 line-clamp-2 select-none outline-isc2-green',
            index === activeTab
              ? 'bg-dark-green border-dark-green pointer-events-none text-white'
              : 'bg-white border-gray-50 text-black'
          )}
          disabled={index === activeTab}
          onClick={() => onActiveTabChange(index)}
          type="button"
          aria-label={tab.text}
        >
          {tab.text}
        </button>
      ))}
    </div>
  );
}
