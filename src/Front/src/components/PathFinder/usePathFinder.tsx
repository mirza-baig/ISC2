import { useCallback, useMemo, useState } from 'react';

import { PathFinderStep } from 'types/index';

const usePathFinder = (initialStepIndex: number, steps: PathFinderStep[]) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(initialStepIndex);
  const [selectedOptionValues, setSelectedOptionValues] = useState({ [initialStepIndex]: '' });

  const currentStep = useMemo(
    () => (steps || []).find((step) => step?.id?.value === currentStepIndex),
    [currentStepIndex, steps]
  );

  const handleNextStep = useCallback(() => {
    if (selectedOptionValues[currentStepIndex]) {
      setCurrentStepIndex(Number(selectedOptionValues[currentStepIndex]));
      return;
    }

    setCurrentStepIndex(currentStepIndex);
  }, [selectedOptionValues, currentStepIndex]);

  const handlePreviousStep = useCallback(() => {
    setCurrentStepIndex(currentStep?.previousStepId?.value ?? 1);
  }, [currentStep]);

  const handleStartOverStep = useCallback(() => {
    setSelectedOptionValues({ [initialStepIndex]: '' });
    setCurrentStepIndex(initialStepIndex);
  }, [initialStepIndex]);

  const setSelectedOptionValue = useCallback(
    (value: string) => {
      setSelectedOptionValues((prevSelectedOptions) => ({
        ...prevSelectedOptions,
        [currentStepIndex]: value,
      }));
    },
    [currentStepIndex]
  );

  return {
    currentStep,
    currentStepIndex,
    selectedOptionValues,
    setCurrentStepIndex,
    setSelectedOptionValue,
    handleNextStep,
    handlePreviousStep,
    handleStartOverStep,
  };
};

export default usePathFinder;
