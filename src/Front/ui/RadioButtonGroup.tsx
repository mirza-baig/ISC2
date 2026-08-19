import RadioButton from 'ui/RadioButton';

interface RadioButtonGroupProps {
  animation?: object;
  legend?: string;
  radioButtons: RadioButton[];
}

const RadioButtonGroup: React.FC<RadioButtonGroupProps> = ({ animation, legend, radioButtons }) => (
  <fieldset className="flex flex-col items-center space-y-5 text-black-100 transition-all">
    {Boolean(legend) && <legend>{legend}</legend>}
    {radioButtons.map((radio, index) => (
      <div
        key={radio.value}
        className="relative flex w-full radio-button radio-wrapper"
        style={{ ...animation, animationDelay: `${index * 100}ms` }}
      >
        <RadioButton {...radio} />
      </div>
    ))}
  </fieldset>
);

export default RadioButtonGroup;
