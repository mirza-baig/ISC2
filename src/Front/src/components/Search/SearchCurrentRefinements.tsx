import clsx from 'clsx';
import { Field } from '@sitecore-jss/sitecore-jss-nextjs';
import { CurrentRefinementsConnectorParamsRefinement } from 'instantsearch.js/es/connectors/current-refinements/connectCurrentRefinements';
import { useCallback } from 'react';
import {
  ClearRefinements,
  CurrentRefinementsProps,
  useCurrentRefinements,
} from 'react-instantsearch-hooks-web';

import { CloseIcon } from 'icons/index';

interface SearchCurrentRefinementsProps extends CurrentRefinementsProps {
  clearFiltersLabel: Field<string>;
}

export default function SearchCurrentRefinements({
  clearFiltersLabel,
  className,
  ...otherProps
}: SearchCurrentRefinementsProps) {
  const { items, canRefine, refine } = useCurrentRefinements(otherProps);

  const removeFilter = useCallback(
    (refinement: CurrentRefinementsConnectorParamsRefinement) => {
      if (canRefine) {
        refine(refinement);
      }
    },
    [canRefine, refine]
  );

  if (!items.length) {
    return null;
  }

  return (
    <section className={clsx('pb-4 flex flex-col', className)}>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => {
          return item.refinements.map((refinement) => (
            <div
              key={`${refinement.attribute}-${refinement.value}`}
              className="cta secondary-cta rounded-tag p-2 pl-4 space-x-2 flex items-center"
            >
              <label>{refinement.value}</label>
              <button
                className="w-5 h-5 bg-gray-30 text-gray-70 text-center flex items-center justify-center rounded-full"
                onClick={() => removeFilter(refinement)}
                tabIndex={0}
                aria-label="Close"
              >
                <CloseIcon size={14} />
              </button>
            </div>
          ));
        })}
      </div>

      <ClearRefinements
        classNames={{
          button: 'cta underline underline-offset-2 mt-6 px-1 focus-isc2-green focus:rounded-sm',
        }}
        translations={{
          resetButtonText: clearFiltersLabel.value,
        }}
      />
    </section>
  );
}
