import clsx from 'clsx';

interface RadioButton {
  label: string;
  value: string;
  checked: boolean;
  onChange: (selectedValue: string) => void;
}

const RadioButton: React.FC<RadioButton> = ({ label, value, checked, onChange }) => {
  const handleChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const value = evt.target.value;
    onChange(value);
  };

  return (
    <label
      key={value}
      className={clsx(
        'flex items-center cursor-pointer w-full body-m tracking-tight px-4 py-6 rounded-md radio-button radio-border',
        {
          'radio-checked': checked,
        }
      )}
      htmlFor={value}
    >
      <input
        className="mt-1 w-4 h-4 cursor-pointer text-isc2-green checked:isc2-green checked:hover:isc2-green checked:active:isc2-green checked:focus:isc2-green focus:isc2-green focus:outline-none focus:ring-2 focus:ring-isc2-green"
        type="radio"
        id={value}
        value={value}
        name={value}
        checked={checked}
        onChange={handleChange}
      />
      <span
        className={clsx('ml-2 radio-button radio-top-left-border radio-top-right-border', {
          'radio-checked': checked,
        })}
      >
        {label}
      </span>
    </label>
  );
};

export default RadioButton;
