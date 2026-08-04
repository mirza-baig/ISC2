import Image from 'next/image';
import type { Hit } from 'instantsearch.js';

export interface ProductHit extends Hit {
  objectID: string;
  productType: string;
  title: string;
  thumbnailImage: string;
  url: string;
  description: string;
}

interface ProductCardHitProps {
  hit: ProductHit;
}

const ProductCardHit = ({ hit }: ProductCardHitProps) => {
  return (
    <a href={hit.url} className="flex shadow-card rounded-md flex-col sm:flex-row p-6 gap-5">
      {hit.thumbnailImage && (
        <Image
          src={hit.thumbnailImage}
          alt={hit.title}
          width={120}
          height={120}
          className="object-contain"
        />
      )}
      <div>
        <label className="eyebrow text-gray-70">{hit.productType}</label>
        <label className="line-clamp-2 md:line-clamp-1 body-l">{hit.title}</label>
        <p className="line-clamp-4 md:line-clamp-2 body-m mt-4">{hit.description}</p>
      </div>
    </a>
  );
};

export default ProductCardHit;
