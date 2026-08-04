import { RefinementListProps } from 'react-instantsearch-hooks-web';

import CheckboxFacet from './CheckboxRefinement';

interface SearchFacetProps extends RefinementListProps {
  type: string;
  className?: string;
  label: string;
  openByDefault: boolean;
  showMoreLabel: string;
}

export default function SearchFacet({ type, ...otherProps }: SearchFacetProps) {
  if (type === 'Checkbox') {
    return <CheckboxFacet {...otherProps} />;
  }

  return null;
}
