import { useCallback, useState } from 'react';
import {
  ComponentRendering,
  Field,
  GetStaticComponentProps,
  RouteData,
  withDatasourceCheck,
} from '@sitecore-jss/sitecore-jss-nextjs';
import clsx from 'clsx';
import { ComponentProps } from 'lib/component-props';
import config from 'temp/config';
import { PathFinderStep } from 'types/index';

import { useAnalyticsTracking } from 'hooks/index';
import usePathFinder from 'components/PathFinder/usePathFinder';
import usePathFinderRadioButtonOptions from 'components/PathFinder/usePathFinderRadioButtonOptions';
import PathFinderInsightContent from 'components/PathFinder/PathFinderInsightContent';
import PathFinderResultCard from 'components/PathFinder/PathFinderResultCard';
import RadioButtonGroup from 'ui/RadioButtonGroup';
import { ANALYTICS_EVENTS } from 'constants/index';

interface Fields {
  previousLabel: Field<string>;
  nextLabel: Field<string>;
  startOverLabel: Field<string>;
}

type PathFinderProps = ComponentProps & {
  rendering: ComponentRendering | RouteData;
  fields?: Fields;
  steps: PathFinderStep[];
};

const PathFinder = ({ fields, steps }: PathFinderProps) => {
  const {
    currentStepIndex,
    selectedOptionValues,
    currentStep,
    handleNextStep,
    handlePreviousStep,
    handleStartOverStep,
    setSelectedOptionValue,
  } = usePathFinder(1, steps);
  const [animation, setAnimation] = useState({});

  const hasResults = currentStep?.type?.value === 'Result' && Boolean(currentStep?.results?.length);
  const nextStepDisabled = !selectedOptionValues[currentStepIndex];
  const showPreviousButton =
    currentStepIndex !== 1 && Boolean(fields?.previousLabel?.value) && !hasResults;
  const showNextButton = !hasResults && Boolean(fields?.nextLabel?.value);
  const showStartOverButton = hasResults && Boolean(fields?.startOverLabel?.value);
  const radioButtonOptions = usePathFinderRadioButtonOptions(
    currentStep,
    selectedOptionValues,
    currentStepIndex,
    setSelectedOptionValue
  );

  const { track } = useAnalyticsTracking();

  const nextPathFinderStep = () => {
    const trackObject = {
      event: ANALYTICS_EVENTS.GA_EVENT,
      type: 'lead',
      subtype: 'pathfinder',
      bo2: true, // business objective 2, Acquisition and Revenue
      bo3: true, // business objective 3, Loyalty and Retention
    };

    const selectedOptionValue = selectedOptionValues[Number(currentStepIndex)];
    const selectedOption = selectedOptionValue && Number(selectedOptionValue);
    const nextStep = steps.find((step) => step.id?.value === selectedOption);

    if (currentStep?.id?.value === 1) {
      track({ ...trackObject, progress: 'begin' });
    } else if (nextStep?.type?.value === 'Result') {
      track({ ...trackObject, progress: 'complete' });
    }

    setAnimation({
      animationName: 'fadeOutLeft',
      animationDuration: '0.3s',
      animationFillMode: 'forwards',
    });

    setTimeout(() => {
      setAnimation({
        opacity: 0,
        animationName: 'fadeInRight',
        animationDuration: '0.3s',
        animationFillMode: 'forwards',
      });
      handleNextStep();
    }, 600);
  };

  const previousPathFinderStep = useCallback(() => {
    setAnimation({
      animationName: 'fadeOutRight',
      animationDuration: '0.3s',
      animationFillMode: 'forwards',
    });

    setTimeout(() => {
      setAnimation({
        opacity: 0,
        animationName: 'fadeInLeft',
        animationDuration: '0.3s',
        animationFillMode: 'forwards',
      });
      handlePreviousStep();
    }, 600);
  }, [handlePreviousStep]);

  const startOverPathFinderStep = useCallback(() => {
    setAnimation({});

    handleStartOverStep();
  }, [handleStartOverStep]);

  if (!currentStep) {
    return null;
  }

  return (
    <section
      className={clsx(
        'path-finder bg-gray-10 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-x-32 md:gap-y-8 px-1 md:px-12 py-14 md:py-26 mb-14 md:mb-20 overflow-hidden',
        {
          'md:min-h-695 ': !hasResults,
        }
      )}
    >
      <div className="col-span-1 px-4 md:pt-4" style={{ ...animation }}>
        <PathFinderInsightContent {...currentStep} />
      </div>
      <div
        className={clsx('col-span-1 px-4 md:pt-4 flex flex-col', {
          'items-start justify-start md:items-end md:justify-end': hasResults,
          'justify-center': !hasResults,
        })}
      >
        {!hasResults && (
          <div className="max-h-400 overflow-y-auto -ml-100 pl-100 -mr-100 pr-100">
            <RadioButtonGroup animation={animation} radioButtons={radioButtonOptions} />
          </div>
        )}
        <div
          className={clsx('flex mt-8 w-full', {
            'mt-0': hasResults,
            'justify-start md:justify-end': currentStepIndex === 1 || hasResults,
            'justify-between': currentStepIndex !== 1 && !hasResults,
          })}
          style={{
            ...animation,
            animationDelay: `${radioButtonOptions.length * 100}ms`,
          }}
        >
          {showPreviousButton && (
            <button
              className="secondary-cta"
              onClick={previousPathFinderStep}
              aria-label={fields?.previousLabel?.value}
            >
              {fields?.previousLabel?.value}
            </button>
          )}

          {showNextButton && (
            <button
              className={clsx('primary-cta', { disabled: nextStepDisabled })}
              onClick={nextPathFinderStep}
              disabled={nextStepDisabled}
              aria-label={fields?.nextLabel.value}
            >
              {fields?.nextLabel.value}
            </button>
          )}

          {showStartOverButton && (
            <button
              className="primary-cta"
              onClick={startOverPathFinderStep}
              aria-label={fields?.startOverLabel.value}
            >
              {fields?.startOverLabel.value}
            </button>
          )}
        </div>
      </div>
      {hasResults && (
        <div className="col-span-1 md:col-span-2 px-4 md:py-4 overflow-x-auto md:overflow-x-initial">
          <div className="path-finder-results flex flex-nowrap space-x-6 md:space-x-0 md:grid md:grid-cols-3 md:gap-6">
            {(currentStep.results || []).map((fields, index) => (
              <PathFinderResultCard key={index} fields={fields} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

interface PathFinderRendering extends ComponentRendering {
  fields: {
    pathFinderFile?: {
      value: {
        src: string;
      };
    };
  };
}

export const getStaticProps: GetStaticComponentProps = async (rendering: PathFinderRendering) => {
  const { src: pathFinderFile } = rendering.fields?.pathFinderFile?.value || { src: '' };

  if (!pathFinderFile) {
    return null;
  }

  const apiUrl =
    pathFinderFile.indexOf('http:') != -1 || pathFinderFile.indexOf('https:') != -1
      ? pathFinderFile
      : `${config.sitecoreApiHost}${pathFinderFile}`;

  try {
    const res = await fetch(apiUrl);
    const steps = await res.json();

    return { steps };
  } catch (err) {
    return null;
  }
};

export default withDatasourceCheck()<PathFinderProps>(PathFinder);
