import { ReactNode } from 'react';

export namespace RoundedSection {
  export type Props = {
    isChecked: boolean;
    label: string;
    id: string;
    onCheck: () => void;
    children?: ReactNode;
  };
}

export function RoundedSection({ isChecked, label, id, onCheck, children }: RoundedSection.Props) {
  return (
    <div className="border border-gray-70 rounded-lg px-5">
      <div className="flex items-center">
        <input
          type="radio"
          id={id}
          checked={isChecked}
          className="h-4 w-4 mr-4 cursor-pointer border body-m checked:border-isc2-green bg-white-00 hover:text-isc2-green checked:text-isc2-green focus:ring-isc2-green focus:ring-1 rounded-full"
          onChange={onCheck}
        />
        <label htmlFor={id} className="body-l text-black flex-1 cursor-pointer py-7.5">
          {label}
        </label>
      </div>
      {isChecked && children}
    </div>
  );
}
