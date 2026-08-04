import { useMemo, useEffect, useState } from 'react';
import Head from 'next/head';
import { useUserSession, useStandalonePrices, useProductForm } from 'providers/index';
import { formatAnalyticsPrice } from 'utils/analytics';
import { ProductHit } from 'types/forms';

interface ProductVariantSchema {
  '@type': string;
  sku: string;
  name: string;
  description?: string;
  url: string;
  image?: string[];
  offers: {
    '@type': string;
    price: number;
    priceCurrency: string;
    availability: string;
    url: string;
    seller: {
      '@type': string;
      name: string;
    };
  };
}

interface ProductGroupSchema {
  '@context': string;
  '@type': string;
  name: string;
  description?: string;
  url: string;
  productGroupID: string;
  brand: {
    '@type': string;
    name: string;
  };
  hasVariant: ProductVariantSchema[];
}

interface ProductSchemaProps {
  productKey: string;
  masterSku: string;
  productTitle: string;
  productDescription?: string;
  baseUrl: string;
  thumbnailImage?: string;
}

const ProductSchema = ({
  productKey,
  masterSku,
  productTitle,
  productDescription,
  baseUrl,
  thumbnailImage,
}: ProductSchemaProps) => {
  const { currencyCode } = useUserSession();
  const { productPrices, showPriceForRole, addSkuToPricingQueue } = useStandalonePrices();
  const { snapshotData } = useProductForm();
  const [isClient, setIsClient] = useState(false);

  // Ensure we only render on client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (masterSku && !productPrices?.[masterSku]) {
      addSkuToPricingQueue([masterSku]);
    }

    if (snapshotData?.length > 0) {
      const variantSkus = snapshotData
        .map((variant) => variant.sku)
        .filter((sku) => sku && !productPrices?.[sku]);

      if (variantSkus.length > 0) {
        addSkuToPricingQueue(variantSkus);
      }
    }
  }, [masterSku, productPrices, addSkuToPricingQueue, snapshotData]);

  const generateProductSchema = useMemo(() => {
    if (!productKey || !masterSku) {
      return null;
    }

    const hasPricingData =
      productPrices?.[masterSku] ||
      (snapshotData?.length > 0 && snapshotData.some((variant) => productPrices?.[variant.sku]));

    const shouldGenerateWithoutPricing =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    if (!hasPricingData && !shouldGenerateWithoutPricing) {
      return null;
    }

    const variants: ProductHit[] =
      snapshotData?.length > 0
        ? snapshotData
        : [
            {
              sku: masterSku,
              title: productTitle,
              description: productDescription,
              productKey: productKey,
              isMasterVariant: true,
            } as ProductHit,
          ];

    const getPriceForSku = (sku: string): number => {
      const priceData = productPrices?.[sku];
      if (priceData) {
        const { price } = formatAnalyticsPrice({
          prices: priceData,
          showPriceForRole,
        });
        const numericPrice = parseFloat(String(price || '0')) || 0;
        return Math.round(numericPrice * 100) / 100;
      }
      return 0;
    };

    const getImageUrl = (imageSrc?: string): string => {
      if (!imageSrc) return '';
      return imageSrc.startsWith('http')
        ? imageSrc
        : `${typeof window !== 'undefined' ? window.location.origin : ''}${imageSrc}`;
    };

    const hasVariant: ProductVariantSchema[] = variants
      .filter((variant) => variant.sku)
      .map((variant) => {
        const price = getPriceForSku(variant.sku);
        const variantImageUrl = getImageUrl(thumbnailImage);

        return {
          '@type': 'Product',
          sku: variant.sku,
          name: variant.title || productTitle,
          description: variant.description || productDescription,
          url: baseUrl,
          ...(variantImageUrl && { image: [variantImageUrl] }),
          offers: {
            '@type': 'Offer',
            price: parseFloat(price.toFixed(2)),
            priceCurrency: currencyCode || 'USD',
            availability: 'https://schema.org/InStock',
            url: baseUrl,
            seller: {
              '@type': 'Organization',
              name: 'ISC2',
            },
          },
        };
      });

    if (hasVariant.length === 1) {
      return JSON.stringify(hasVariant[0], null, 2);
    }

    const schema: ProductGroupSchema = {
      '@context': 'https://schema.org',
      '@type': 'ProductGroup',
      name: productTitle,
      description: productDescription,
      url: baseUrl,
      productGroupID: productKey,
      brand: {
        '@type': 'Brand',
        name: 'ISC2',
      },
      hasVariant,
    };

    return JSON.stringify(schema, null, 2);
  }, [
    productKey,
    masterSku,
    productTitle,
    productDescription,
    baseUrl,
    thumbnailImage,
    productPrices,
    showPriceForRole,
    snapshotData,
    currencyCode,
  ]);

  if (!isClient || !generateProductSchema) {
    return null;
  }

  return (
    <Head>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: generateProductSchema }}
      />
    </Head>
  );
};

export default ProductSchema;
