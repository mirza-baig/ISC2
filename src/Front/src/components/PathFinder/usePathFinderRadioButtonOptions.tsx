import { useMemo } from 'react';
import { PathFinderStep } from 'types/index';

const usePathFinderRadioButtonOptions = (
  currentStep: PathFinderStep | undefined,
  selectedOptionValues: { [key: number]: string },
  currentStepIndex: number,
  setSelectedOptionValue: (selectedValue: string) => void
) => {
  const radioButtonOptions = useMemo(() => {
    if (currentStep?.type?.value === 'Step') {
      return (currentStep?.options || []).map((option) => ({
        label: option?.response?.value,
        value: option?.nextStep?.value?.toString(),
        checked: option?.nextStep?.value === Number(selectedOptionValues[currentStepIndex]),
        onChange: (selectedValue: string) => setSelectedOptionValue(selectedValue),
      }));
    }

    return [];
  }, [currentStep, selectedOptionValues, currentStepIndex, setSelectedOptionValue]);

  return radioButtonOptions;
};

export default usePathFinderRadioButtonOptions;
