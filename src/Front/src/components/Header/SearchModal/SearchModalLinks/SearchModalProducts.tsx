import { useMemo } from 'react';
import Image from 'next/image';

import { useAutocompleteLinks } from 'hooks/index';
import { useAutocomplete } from 'providers/index';
import { LoadingIndicator } from 'ui/index';

export default function SearchModalProducts() {
  const { productRecommendations, isLoading } = useAutocomplete();
  const { productRecommendationsSection } = useAutocompleteLinks();

  const ProductsContent = useMemo(() => {
    if (isLoading) {
      return <LoadingIndicator className="justify-self-center self-center" />;
    }

    const suggestions = [
      ...productRecommendations,
      ...productRecommendationsSection.defaultSuggestions,
    ].slice(0, 2);

    return (
      <div className="grid gap-3 md:gap-6 md:grid-cols-2">
        {suggestions.map((product) => (
          <a
            key={product.title}
            href={product.url}
            className="flex border-t border-t-gray-10 bg-white shadow-md rounded-md flex-row items-center pr-5 py-3"
          >
            <Image src={product.thumbnailImage} alt={product.title} width={60} height={60} />
            <p>
              <label className="eyebrow text-gray-70">{product.productType}</label>
              <label className="line-clamp-3 body-m">{product.title}</label>
            </p>
          </a>
        ))}
      </div>
    );
  }, [isLoading, productRecommendations, productRecommendationsSection.defaultSuggestions]);

  return (
    <div className="max-md:order-3 flex flex-1 flex-col space-y-5">
      <span tabIndex={0} className="flex eyebrow pb-2 w-full border-b text-gray-70 border-gray-30">
        {productRecommendationsSection.title.value}
      </span>
      {ProductsContent}
    </div>
  );
}
