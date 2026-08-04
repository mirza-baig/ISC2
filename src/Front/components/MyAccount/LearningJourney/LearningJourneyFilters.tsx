import clsx from 'clsx';
import { LeaningJourneyLabels } from './LearningJourney';

interface LearningJourneyFiltersProps {
  fields: {
    filters: string[];
    selectedFilter: string | undefined;
    setSelectedFilter: (selectedFilter: string | undefined) => void;
    labels: LeaningJourneyLabels;
  };
}

export const EXAM_VALUE = 'exam';

export enum LearningJourneyFilterTypes {
  exam = 'Exams',
  'exam-prep' = 'Trainings',
  course = 'Courses',
  'express-course' = 'Express Courses',
  event = 'Events', // Event/Conference Sponsorships
  resource = 'Resources',
}

const LearningJourneyFilters = ({ fields }: LearningJourneyFiltersProps) => {
  const { filters, selectedFilter, setSelectedFilter, labels } = fields;

  const FilterButton = ({ filter, label }: { filter: string | undefined; label: string }) => {
    return (
      <button
        type="button"
        className={clsx(
          'px-4 py-2 text-sm-base rounded-3xl text-nowrap border border-transparent transition-border hover:border-gray-70',
          selectedFilter === filter && '!border-isc2-green'
        )}
        aria-label={label}
        onClick={() => setSelectedFilter(filter)}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="flex space-x-2 py-5 sm:py-3 font-semibold border-y border-gray-30 overflow-x-auto">
      <FilterButton filter={undefined} label={labels.filterOptionAllLabel} />
      {filters.map((filter) => {
        if (!(filter in LearningJourneyFilterTypes)) {
          return null;
        }

        return (
          <FilterButton
            key={`learning-journey-${filter}`}
            filter={filter}
            label={LearningJourneyFilterTypes[filter as keyof typeof LearningJourneyFilterTypes]}
          />
        );
      })}
    </div>
  );
};

export default LearningJourneyFilters;
