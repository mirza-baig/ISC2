/* eslint-disable @typescript-eslint/no-empty-function */
import {
  createContext,
  Dispatch,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { ComponentRendering, Field } from '@sitecore-jss/sitecore-jss-nextjs';
import {
  BUNDLE_TYPES,
  BundleOption,
  BundleOptions,
  BundleProductKeyItemSkuMap,
  CT_BANNED_TIERS,
  CUSTOMER_PRICING_GROUP_MAP,
  ProductTypes,
  StandalonePriceMapping,
} from 'types/index';
import isEqual from 'lodash.isequal';

import {
  getProductSelectorSearchResult,
  correctDigits,
  getAccumulatedPrice,
  formatProductSearchResult,
  // This could be restored in the next project iteration when we turn on filtering by training provider
  // extractAttributeValue,
  getRadioButtonsPriceData,
  getChannel,
} from 'utils/index';
import {
  FormElement,
  FormFields,
  INNER_PROVIDER_KEY,
  ProductDate,
  ProductDateGroup,
  ProductFormFacetData,
  ProductFormSearchResult,
  ProductHit,
  ProductOptionData,
  ProductOptionValue,
  ProductOptions,
  ProductPrice,
  FormElementOptionPricing,
  FormElementTypes,
  ProductHitKeyValuePair,
  StandalonePrice,
  FormAdditionalData,
} from 'types/index';
import { useLoggedUser, useGetInventory, useGetDistributionChannel } from 'hooks/index';
import { CurrencyCodes } from 'utils/currencies';
import { ProductFormModalType } from 'components/ProductForm/ProductFormModal';

import { useUserSession } from './userSession';
import { useStandalonePrices } from './standalonePrices';

export const baseProductPrice = {
  currencyCode: CurrencyCodes.USD,
  centAmount: 0,
  fractionDigits: 2,
};

type ProductFormContextProps = {
  rendering: ComponentRendering | undefined;
  priceTitles: {
    regularPriceText?: Field<string>;
    memberPriceText?: Field<string>;
    candidatePriceText?: Field<string>;
    associatePriceText?: Field<string>;
    isForFreeText?: Field<string>;
  };
  isThirdPartyProvider: boolean;
  selectedProduct: ProductOptions;
  toggleSelectedProduct: (option: { [key: string]: ProductOptionData }, parentKey?: string) => void;
  presetSelectedProduct: (options: ProductOptions) => void;
  confirmedDate: ProductDate | null;
  updateConfirmedDate: (date: ProductDate | null) => void;
  currentPrice: { [key: string]: StandalonePrice } | null;
  scheduleData: ProductDateGroup[] | undefined;
  setScheduleData: (data: ProductDateGroup[] | undefined) => void;
  productFormFields: FormElement[];
  setProductFormFields: (val: FormElement[]) => void;
  productFieldPrices: FormElementOptionPricing | undefined;
  modalContent: ProductFormModalType;
  setModalContent: (data: ProductFormModalType) => void;
  isProductConfigured: boolean;
  facetList: ProductFormFacetData;
  conditionalFieldsMandatoryState: { [name: string]: boolean | null };
  formFieldsDependecy: FormElement[];
  isShowPrices: boolean;
  formFieldsAreValid: boolean;
  priceRoleKey: string;
  inventoryEntries: { [sku: string]: number };
  selectedOptionSkus: string[];
  setSelectedOptionSkus: (sku: string[]) => void;
  setOptionPriceData: (
    formLabels: { [name: string]: string },
    productPrices: StandalonePriceMapping
  ) => void;
  snapshotData: ProductHit[];
  productVariants: ProductHit[];
  facetListSnapshot: ProductFormFacetData;
  isSearchError: boolean;
  allocationId: string | null;
  setAllocationId: (allocationId: string | null) => void;
  isRedeemingCompleted: boolean;
  setIsRedeemingCompleted: (isRedeemingCompleted: boolean) => void;
  bundlePdpData: ProductHit | undefined;
  bundleOptions: BundleOption[];
  setProductKey: Dispatch<SetStateAction<string>>;
  productKey?: string;
  isProductSetMode: boolean;
  bundleProductKeyItemSkusMap?: BundleProductKeyItemSkuMap;
  isBannedTier: boolean;
};

const ProductFormContext = createContext<ProductFormContextProps>({
  rendering: undefined,
  priceTitles: {
    regularPriceText: undefined,
    memberPriceText: undefined,
    candidatePriceText: undefined,
    associatePriceText: undefined,
    isForFreeText: undefined,
  },
  isThirdPartyProvider: false,
  selectedProduct: {},
  toggleSelectedProduct: () => {},
  presetSelectedProduct: () => {},
  confirmedDate: null,
  updateConfirmedDate: () => {},
  currentPrice: null,
  scheduleData: undefined,
  setScheduleData: () => {},
  productFormFields: [],
  setProductFormFields: () => {},
  productFieldPrices: {},
  modalContent: {},
  setModalContent: () => {},
  isProductConfigured: false,
  facetList: {},
  conditionalFieldsMandatoryState: {},
  formFieldsDependecy: [],
  isShowPrices: false,
  formFieldsAreValid: false,
  priceRoleKey: '',
  inventoryEntries: {},
  selectedOptionSkus: [],
  setSelectedOptionSkus: () => {},
  setOptionPriceData: () => {},
  snapshotData: [],
  productVariants: [],
  facetListSnapshot: {},
  isSearchError: false,
  allocationId: null,
  setAllocationId: () => {},
  isRedeemingCompleted: false,
  setIsRedeemingCompleted: () => {},
  bundlePdpData: undefined,
  bundleOptions: [] as BundleOption[],
  setProductKey: () => {},
  productKey: undefined,
  isProductSetMode: false,
  bundleProductKeyItemSkusMap: undefined,
  isBannedTier: false,
});

type ProductFormProviderProps = {
  children: React.ReactNode;
  rendering: ComponentRendering;
};

// provider delivers data for the pdp forms and calculates prices for selectors and summary block
// provider builds dynamic form structure, considering scaffolds
// there are different scenarios on pdp: variant picking via the date selector, certifications pdp selection, and usual search output, bundle pdp, bundles on product/variant levels and products sets
// provider gathers data from algolia (search results among the products and variants), and data from CT via service layer: inventory, standalone price
// product variants search requests do not contain bundle product variants within, for that bundles has its own search requests

// summary price (currentPrice below in the code) is calculated considering all roles for all roles

const ProductFormProvider: React.FC<ProductFormProviderProps> = ({ rendering, children }) => {
  const { currencyCode, geolocationCountry } = useUserSession();
  const { isUserMember, isUserCandidate, isUserAssociate } = useLoggedUser();
  const { distributionChannel } = useGetDistributionChannel();
  const { productPrices, addSkuToPricingQueue } = useStandalonePrices();
  const [isProductSetMode, setIsProductSetMode] = useState<boolean>(false); // used to set the state of productSet mode, in case if we receive itemsRef in search response
  const [bundlePdpData, setBundlePdpData] = useState<ProductHit | undefined>(); // expandable single pdp bundle selector
  const [bundleData, setBundleData] = useState<BundleOptions>({}); // bundles for purchase options
  const [isSearchError, setIsSearchError] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductOptions>({}); // set of selected filters from scaffold
  const [searchResults, setSearchResults] = useState<ProductFormSearchResult | undefined>(); // formatted algolia search result considering inventory
  const [confirmedDate, setConfirmedDate] = useState<ProductDate | null>(null); // used to select schedule
  const [facetList, setFacetList] = useState<ProductFormFacetData>({}); // list of filtered facets, updated on each selection
  const [scheduleData, setScheduleData] = useState<ProductDateGroup[] | undefined>(); // schedule data of the filtered variants
  const [productFormFields, setProductFormFields] = useState<FormElement[]>([]); // reflect structure of the form fields
  const [modalContent, setModalContent] = useState<ProductFormModalType>({}); // modal content
  const [isProductConfigured, setIsProductConfigured] = useState<boolean>(false); // flag to detect whether the product is configured
  const [facetListSnapshot, setFacetListSnapshot] = useState<ProductFormFacetData>({}); // list of facets to which the facetList is comparing
  const [selectedOptionSkus, setSelectedOptionSkus] = useState<string[]>([]); // in case of direct purchase variants selection we store selected skus for push to the cart
  const [productKey, setProductKey] = useState<string | undefined>();
  // as initial load of the form consider we receive all possible results, it is used to build dynamic structure
  // of the form, based on the scaffold hierarchy dependency, from top to bottom
  // the pdp form should consider all possible variants and in case if some options which are applicable for some cases
  // do not match the selected variants - they are going to be output in the disabled state
  // all other options should be filtered out, if they are marked isConditionallyRequired: true in scaffold
  const [stateSnapshot, setStateSnapshot] = useState<ProductFormSearchResult | undefined>();

  const [allocationId, setAllocationId] = useState<string | null>(null); // used when the user is redeeming an allocated OIL product (b2b)
  const [isRedeemingCompleted, setIsRedeemingCompleted] = useState<boolean>(false); // used when the user is redeeming an allocated OIL product (b2b)

  // handle conditional fields (hide/show)
  // if all siblings do not have undefined value - make obligatory  - true
  // if siblings have undefined values - make them optional         - false
  // if all siblings has only undefined values - hide field         - null
  const [conditionalFieldsMandatoryState, setConditionalFieldsMandatoryState] = useState<{
    [name: string]: boolean | null;
  }>({});

  // used to fill option selectors (like bundles/purchase options) with prices
  const [productFieldPrices, setProductFieldPrices] = useState<
    FormElementOptionPricing | undefined
  >();

  // as bundles uses their own search and fetch - it is used to store the product variants skus to validate appearence
  const [bundleProductKeyItemSkusMap, setBundleProductKeyItemSkusMap] = useState<
    BundleProductKeyItemSkuMap | undefined
  >();

  // as bundle-associated product variants are not part of the main search,
  // here we collect all product skus associated with the bundles to fetch their data (inventory for example) in a single request
  const bundleTotalSkus = useMemo(() => {
    const data = Object.values(bundleData).reduce((acc: string[], bundleItems) => {
      return [...acc, ...bundleItems.flatMap((bundleItem) => bundleItem?.itemVariantSkuList || [])];
    }, []);
    return [...new Set<string>(data)];
  }, [bundleData]);

  // fetch of inventory values from CT
  // it fetches inventory from initial search, thus we do not need to make extra fetches each time we search
  // it also conside bundle-associated skus, to check further that the bundles have included items which are existing
  const { inventoryEntries } = useGetInventory({
    skuList: [
      ...(stateSnapshot?.currentFacetOptions?.sku?.map((item) => item.value) || []),
      ...bundleTotalSkus,
      ...(bundlePdpData?.itemVariantSkuList || []),
      ...(Object.values(bundleProductKeyItemSkusMap || {})?.flatMap((skus) => skus) || []),
    ].filter(Boolean),
  });

  // callback to get variant list, filtered by presense of schedule fields
  // (where there is schedule selector, we have to output even expired records)
  // or by inventory presence in other case
  const getFilteredVariantsList = useCallback(
    (dataList: ProductHit[]) => {
      const isWithScheduleField =
        productFormFields?.length &&
        productFormFields.some((field) => field.type === FormElementTypes.schedule);

      if (isWithScheduleField) {
        return dataList;
      }
      if (Object.keys(inventoryEntries)?.length) {
        return dataList?.filter(({ sku }) => inventoryEntries[sku]);
      }
      return [];
    },
    [inventoryEntries, productFormFields]
  );

  // list of general filtered search results
  const productVariants = useMemo(() => {
    return getFilteredVariantsList(searchResults?.results || []);
  }, [getFilteredVariantsList, searchResults?.results]);

  const bundleOptions = useMemo(() => {
    // filter out bundles which has 0 inventory of any inner item
    if (!bundleData && !inventoryEntries && !productVariants) {
      return [];
    }
    // if no match with search results, we disable only variant-based skus, not product-based
    const skuReferenceVariant = Array.from(
      new Set(productVariants?.flatMap((item) => item.skuReferencesVariant || []))
    );
    // will compare with product list, so in case of repeating same sku on both levels it won't be considered to filter out
    // as product level bundles are output always and have higher priority
    const skuReferenceSnapshotProduct = Array.from(
      new Set(stateSnapshot?.results?.flatMap((item) => item.skuReferencesProduct || []))
    );
    const skuReferenceSnapshotVariant = Array.from(
      new Set(stateSnapshot?.results?.flatMap((item) => item.skuReferencesVariant || []))
    );
    // compare the changes on search with filters and get the list of disabled bundle skus for variant-based bundles
    const disabledSkuReferences = skuReferenceSnapshotVariant?.filter(
      (snapshotSku) =>
        !skuReferenceSnapshotProduct.includes(snapshotSku) &&
        !skuReferenceVariant.includes(snapshotSku)
    );

    return Object.keys(bundleData)
      .reduce((acc, key) => {
        const bundleEntry = bundleData[key as keyof typeof bundleData];
        const bundleVariantSkuValues =
          bundleEntry
            ?.filter((bundle) => {
              // if sku-variants based bundles
              if (bundle.itemVariantSkuList?.length) {
                // if any item does not have inventory - it returns true value which we invert for filter
                return !bundle.itemVariantSkuList?.some((sku) => !inventoryEntries?.[sku]);
              }
              // if product-key based bundle
              if (bundle.itemProductKeyList?.length) {
                // if any item does not have inventory - it returns true value which we check within every related product key map entry and invert for filter
                return !bundle.itemProductKeyList?.some((keyValue) => {
                  return bundleProductKeyItemSkusMap?.[keyValue]?.some(
                    (embeddedSku) => !inventoryEntries?.[embeddedSku]
                  );
                });
              }
            })
            .map((bundle) => {
              return {
                ...bundle,
                disabled: disabledSkuReferences?.includes(bundle.sku),
              };
            }) || [];
        return [...acc, ...bundleVariantSkuValues];
      }, [])
      .sort((a, b) => {
        const argA = a.copyName || a.title;
        const argB = b.copyName || b.title;
        return argB > argA ? -1 : argB < argA ? 1 : 0;
      });
  }, [
    bundleData,
    productVariants,
    inventoryEntries,
    bundleProductKeyItemSkusMap,
    stateSnapshot?.results,
  ]);

  useEffect(() => {
    // and fetch only the prices for bundles which pass inventory check
    const skus = bundleOptions.map((bundle) => bundle.sku);
    const filteredSkus = [...new Set<string>(skus)];

    if (filteredSkus?.length) {
      // when we add sku here, the service layer fetch corresponding prices from CT
      addSkuToPricingQueue(filteredSkus);
    }
  }, [bundleOptions, addSkuToPricingQueue]);

  // initial data for constructing pdp form (the data, used to represent the entire list of radio button options,
  // which could have the disabled state, as algolia returns in each response only those records, which fits facets,
  // others are filtered out).
  const snapshotData = useMemo(() => {
    return getFilteredVariantsList(stateSnapshot?.results || []).sort((a, b) => {
      const isMasterA = (a.isMasterVariant && 1) || 0;
      const isMasterB = (b.isMasterVariant && 1) || 0;
      return isMasterB - isMasterA;
    });
  }, [getFilteredVariantsList, stateSnapshot?.results]);

  // construct facet filters for bundle request (gather sku values), as we retrive bundle data from algolia
  // to match bundle product items attributes with the main search attributes
  // used in bundles only (not for bundle-pdp)
  const selectedProductFacets = useMemo(() => {
    return Object.keys(selectedProduct).reduce((acc, item) => {
      const option = selectedProduct?.[item];
      return option?.data?.value && !option?.data?.noAlgoliaConnection
        ? [...acc, `${item}:${option?.data?.value}`]
        : [...acc];
    }, []);
  }, [selectedProduct]);

  // fetch algolia index with the selected facet data
  // in response we filter out those records, which do not have required or conditionally required fields
  const fetchProductSelectorSearch = async ({
    facets,
    productIds,
    skus,
    productKeys,
    productFormFields,
  }: {
    facets?: string[];
    productIds?: string[];
    skus?: string[];
    productKeys?: string[];
    productFormFields: FormElement[];
  }) => {
    const response = await getProductSelectorSearchResult({
      facets,
      productIds,
      productKeys,
      skus,
    });

    if (!response) {
      return;
    }

    const parsedResponse = formatProductSearchResult(response, productFormFields);
    const algoliaFacetListReceived = Object.keys(parsedResponse?.facets || {});
    const [durationKey] = FormFields.TrainingDuration.key.split('.');
    const [providerKey, providerSubKey] = FormFields.TrainingProvider.key.split('.');

    const facetAlgoliaOptionsList: ProductFormFacetData = algoliaFacetListReceived.reduce(
      (accFacets, item) => {
        const [name, key]: (string | undefined)[] = item.split('.');
        const dataSet = parsedResponse?.hits?.reduce(
          (acc: { [facetName: string]: { [facetKey: string]: string } }, hit: ProductHit) => {
            const hitData = hit?.[name as keyof typeof hit];
            // supposed we do not output third party duration fields and do not filter by them
            // isFillData below delivers it
            const isFillData =
              (name === durationKey &&
                hit?.[name as keyof typeof hit] &&
                typeof hit === 'object' &&
                (hit?.[providerKey as keyof typeof hit] as keyof ProductHitKeyValuePair)?.[
                  providerSubKey as keyof string
                ] === INNER_PROVIDER_KEY) ||
              name !== durationKey;
            const isObj = key && typeof hitData === 'object';
            const label = isObj && 'label' in hitData ? hitData.label : hitData;
            const value = isObj && `key` in hitData ? hitData.key : hitData;

            return {
              ...acc,
              ...(isFillData &&
                label &&
                value && {
                  [name]: {
                    ...acc?.[name],
                    [value.toString()]: label,
                  },
                }),
            };
          },
          {}
        );
        const data = {
          [item]: dataSet?.[name]
            ? Object.entries(dataSet[name])
                .map(([dataValue, dataLabel]) => ({
                  label: dataLabel,
                  value: dataValue,
                }))
                .sort((a, b) => `${a.label}`.localeCompare(`${b.label}`))
            : [],
        };
        return {
          ...accFacets,
          ...data,
        };
      },
      {}
    );

    return {
      results: parsedResponse?.hits || [],
      currentFacetOptions: facetAlgoliaOptionsList,
    } as ProductFormSearchResult;
  };

  // bundle-pdp products fetch
  const fetchBundlePdpItems = useCallback(
    async ({ skus, productKeys }: { skus?: string[]; productKeys?: string[] }) => {
      const searchData = await fetchProductSelectorSearch({
        skus,
        productKeys,
        productFormFields,
      });
      setSearchResults(searchData);
      setStateSnapshot((data) => (data ? data : searchData));

      // if product keys setup, we create the map of embedded product variants skus to check their inventory
      if (productKeys?.length) {
        const productKeySkusMap = productKeys.reduce((acc, item) => {
          return {
            ...acc,
            [item]: searchData?.results
              ?.filter((hit) => hit.productKey === item)
              .map(({ sku }) => sku),
          };
        }, {});
        setBundleProductKeyItemSkusMap((data) => (data ? data : productKeySkusMap));
      }
    },
    [productFormFields]
  );

  // productSet handler
  const setProductSetData = useCallback(
    async (products: ProductHit[]) => {
      const refsProductIds = products?.flatMap((item) => {
        return item.itemsRef
          ?.map((ref) => {
            const productIdData = ref?.find((refItem) => refItem.name === 'masterProductRef');
            const id =
              typeof productIdData?.value === 'object' && item !== null && productIdData.value.id;
            return id;
          })
          .filter(Boolean);
      }) as string[];

      const searchData = await fetchProductSelectorSearch({
        facets: [],
        productIds: refsProductIds,
        productFormFields,
      });
      setIsProductSetMode(true);
      setSearchResults(searchData);
      setStateSnapshot((data) => (data ? data : searchData));
    },
    [productFormFields]
  );

  // form main search flow fetch
  const getSearchResults = useCallback(
    async ({
      facets,
      productIds,
      productKeys,
      skus,
    }: {
      facets: string[];
      productIds?: string[];
      productKeys?: string[];
      skus?: string[];
    }) => {
      const searchData = await fetchProductSelectorSearch({
        facets,
        productIds,
        productKeys,
        skus,
        productFormFields,
      });
      const bundleEntry = searchData!.results.find(
        (item) => item.productType === ProductTypes.bundle
      );
      const productSetEntry = searchData!.results.find((item) => item.hasOwnProperty('itemsRef'));

      if (bundleEntry && !bundlePdpData) {
        // in root it will be single
        setBundlePdpData(searchData!.results[0]);
        // perform search of embedded elements by skus/productKeys
        // additional facets filters are not present for bundle-pdp
        fetchBundlePdpItems({
          ...(bundleEntry?.itemVariantSkuList && { skus: bundleEntry.itemVariantSkuList }),
          ...(bundleEntry?.itemProductKeyList && { productKeys: bundleEntry.itemProductKeyList }),
        });
      } else if (productSetEntry) {
        // detect productSet group by presence of the itemsRef attribute
        setProductSetData(searchData!.results);
      } else if (searchData?.results?.length) {
        // perform usual search with possibility to find included bundles (handled further in useEffect)
        setIsSearchError(false);
        setSearchResults(searchData);
        if (!stateSnapshot) {
          setStateSnapshot(searchData);
        }
      } else {
        setIsSearchError(true);
      }
    },
    [productFormFields, bundlePdpData, stateSnapshot, fetchBundlePdpItems, setProductSetData]
  );

  // fetch for bundle data (product and variant level)
  const fetchSkuReferenceItems = useCallback(
    async ({
      skuReferencesProduct,
      skuReferencesVariant,
    }: {
      skuReferencesProduct: string[];
      skuReferencesVariant: string[];
    }) => {
      // we do not fetch bundle data twice
      if (Object.keys(bundleData)?.length) {
        return;
      }
      // fetch product and variant level bundles
      const productBundles =
        (skuReferencesProduct?.length &&
          (
            await getProductSelectorSearchResult({
              skus: skuReferencesProduct || null,
            })
          )?.hits) ||
        [];
      const variantBundles = (
        (skuReferencesVariant?.length &&
          (
            await getProductSelectorSearchResult({
              skus: skuReferencesVariant || null,
            })
          )?.hits) ||
        []
      ).filter(({ sku }) => !productBundles.some((hit) => hit.sku === sku));

      const bundles = Array.from(new Set([...productBundles, ...variantBundles]));

      if (!bundles?.length) {
        return;
      }
      const bundleProductKeysList = bundles?.flatMap((item) => item.itemProductKeyList || []);

      // here we construct bundleProductKeyItemSkusMap
      const bundleItemsDataByProductKeys = bundleProductKeysList?.length
        ? (
            await getProductSelectorSearchResult({
              productKeys: bundleProductKeysList,
            })
          )?.hits
        : [];

      const productKeySkusMap = bundleProductKeysList?.length
        ? bundleProductKeyItemSkusMap ||
          bundleProductKeysList.reduce((acc, item) => {
            return {
              ...acc,
              [item]: bundleItemsDataByProductKeys
                ?.filter((hit) => hit.productKey === item)
                .map(({ sku }) => sku),
            };
          }, {})
        : null;

      if (productKeySkusMap) {
        setBundleProductKeyItemSkusMap((data) => (data ? data : productKeySkusMap));
      }

      setBundleData({
        ...(productBundles && { [BUNDLE_TYPES.PRODUCT]: productBundles }),
        ...(variantBundles && { [BUNDLE_TYPES.VARIANT]: variantBundles }),
      });
    },
    [bundleData, bundleProductKeyItemSkusMap]
  );

  useEffect(() => {
    // check for the bundle skuReferences (bundles for purchase-options form fieldset) in items
    if (stateSnapshot) {
      // get list of product-level or variant-level bundles
      const skuReferencesVariant = Array.from(
        new Set(stateSnapshot?.results?.flatMap((item) => item.skuReferencesVariant || []))
      );
      const skuReferencesProduct = Array.from(
        new Set(stateSnapshot?.results?.flatMap((item) => item.skuReferencesProduct || []))
      );
      fetchSkuReferenceItems({
        skuReferencesVariant,
        skuReferencesProduct,
      });
    }
  }, [stateSnapshot, fetchSkuReferenceItems, setBundlePdpData]);

  // roles which are used for pricing in form fields
  // construct its values depending on the flags from the logged-in user
  const priceRoleKey = useMemo(() => {
    return isUserMember
      ? CUSTOMER_PRICING_GROUP_MAP.MEMBERS
      : isUserCandidate
      ? CUSTOMER_PRICING_GROUP_MAP.CANDIDATES
      : isUserAssociate
      ? CUSTOMER_PRICING_GROUP_MAP.ASSOCIATES
      : CUSTOMER_PRICING_GROUP_MAP.NON_MEMBERS;
  }, [isUserMember, isUserCandidate, isUserAssociate]);

  // callback to setup bundle prices (which are output in purchase option or bundle prices radio selectors)
  const setOptionPriceData = useCallback(
    (formLabels: { [name: string]: string }, productPrices: StandalonePriceMapping) => {
      // check which is the field type
      const isBundlePdpOptions = productFormFields?.some(
        (field) => field.name === FormFields.BundleOptions.key
      );
      const isPurchaseOptions = productFormFields?.some(
        (field) => field.name === FormFields.PurchaseOptions.key
      );

      if (snapshotData) {
        const data =
          snapshotData?.map((item) =>
            getRadioButtonsPriceData(item, priceRoleKey, productPrices, isPurchaseOptions)
          ) || [];

        const bundlePdp =
          bundlePdpData &&
          getRadioButtonsPriceData(bundlePdpData, priceRoleKey, productPrices, isPurchaseOptions);

        const bundlePdpArray = [
          {
            label: formLabels?.[FormAdditionalData.SelectProducts.key],
            value: FormAdditionalData.SelectProducts.key,
            ...(isBundlePdpOptions && {
              addOn: data, // addOn represens multiple variant selection (the checkboxes fields in pdp form)
            }),
          },
        ];

        if (bundlePdp?.label && bundlePdp?.value) {
          bundlePdpArray.unshift(bundlePdp); // bundle pdp item itself should go as the first, so it adds bundlePdp at the beginning of the bundlePdpArray, which includes entire data structure for bundle-pdp form
        }

        const bundleArrayPriceData = bundleOptions.map((item) =>
          getRadioButtonsPriceData(item, priceRoleKey, productPrices, isPurchaseOptions)
        );

        setProductFieldPrices({
          ...(isBundlePdpOptions && {
            [FormFields.BundleOptions.key]: bundlePdpArray,
          }),
          ...(isPurchaseOptions && {
            [FormFields.PurchaseOptions.key]: [...data, ...bundleArrayPriceData],
          }),
        });
      }
    },
    [snapshotData, bundleOptions, bundlePdpData, productFormFields, priceRoleKey]
  );

  // set isThirdPartyProvider flag in case the third party option is selected
  // as we do not have this selector in selected state(it is commented out, may be resored in further project iterations), it will never happen
  const isThirdPartyProvider = useMemo(
    () =>
      Boolean(
        selectedProduct[FormFields.TrainingProvider.key]?.data?.value &&
          selectedProduct[FormFields.TrainingProvider.key]?.data?.value !== INNER_PROVIDER_KEY
      ),
    [selectedProduct]
  );

  // filtered form fields dependency order
  // used for conditional filtering
  // as we show bundle/purchase and shcedule selector options after the previous fields selected, we filter them out
  const formFieldsDependecy = useMemo(() => {
    return (
      productFormFields?.filter(
        (item) =>
          (item.type === FormElementTypes.select || item.type === FormElementTypes.radio) &&
          item.name !== FormFields.BundleOptions.key &&
          item.name !== FormFields.PurchaseOptions.key
      ) || []
    );
  }, [productFormFields]);

  // here we build the initial facet structure to represent it in the form,
  // considering dependency in the scaffold field order from top to bottom
  // algolia outputs only those facets which are matching the current selection, for example it will not show list of possible selections of the last node
  // according to the demands we should show not only the current facets, but possible variants, considering field dependency
  // described in the scaffolds
  // each level is a scaffold record in filtered array structure, represented by the formFieldsDependecy
  // we iterate throught the form structure and fill the possible facet options into the result structure,
  // considering dependency accross the initial search result, which has all possible records

  useEffect(() => {
    if (!snapshotData) {
      return;
    }
    let facetResult: ProductFormFacetData = {};
    const isScheduleFieldPresent = productFormFields.some(
      // we check whether the schedule variant selector present
      (item) => item.type === FormElementTypes.schedule
    );

    const traverse = (
      stateData: ProductHit[],
      prevSelectedNode: ProductOptionValue | null = null,
      level = 0
    ) => {
      if (level >= formFieldsDependecy.length) {
        return;
      }
      const currentLevelName = formFieldsDependecy[level].name;
      // This could be restored in the next project iteration when we turn on filtering by training provider
      // const isHideForThirdPartyFlag = formFieldsDependecy[level].hideForThirdParty;
      const prevLevelName = level > 0 ? formFieldsDependecy[level - 1].name : null;
      const [key, subKey] = currentLevelName.split('.');
      const [prevKey, prevSubKey] = prevLevelName ? prevLevelName?.split('.') : [null, null];
      const selectedNode = selectedProduct[currentLevelName];
      const prevSelectedNodeValue = prevSelectedNode?.data?.value;
      const filteredRowResult =
        !prevSelectedNodeValue || (prevSelectedNode && prevSelectedNodeValue === undefined)
          ? stateData
          : stateData.filter((item) => {
              const source = prevSubKey
                ? (item[prevKey as keyof typeof item] as keyof ProductHitKeyValuePair)[
                    prevSubKey as keyof string
                  ]
                : item[prevKey as keyof typeof item];
              return source === prevSelectedNodeValue;
            });
      const keyValuePairs = new Map();
      filteredRowResult.forEach((item) => {
        const value = subKey
          ? (item[key as keyof typeof item] as keyof ProductHitKeyValuePair)?.[
              subKey as keyof string
            ]
          : item[key as keyof typeof item];
        const label = subKey
          ? (item[key as keyof typeof item] as keyof ProductHitKeyValuePair)?.[
              'label' as keyof string
            ]
          : value;
        // This could be restored/adjusted in the next project iteration when we turn on filtering by training provider
        //const provider = extractAttributeValue(item, FormFields.TrainingProvider.key);
        /*if (
          !isHideForThirdPartyFlag ||
          // if no provider is selected - we consider it as inner provider
          (isHideForThirdPartyFlag && (!provider || provider === INNER_PROVIDER_KEY))
        ) {*/
        keyValuePairs.set(value, label);
        /*}*/
      });
      facetResult = {
        ...facetResult,
        [currentLevelName]: Array.from(keyValuePairs, ([value, label]) => ({
          value,
          label,
        })),
      };
      traverse([...filteredRowResult], selectedNode, level + 1);
    };

    // collect scaffold data
    // if it is inner provider - it takes all data from snapshot
    // if it is external - it checks inventory

    // This could be restored/adjusted in the next project iteration when we turn on filtering by training provider

    const snapshotFilteredThirdParty = [...snapshotData]; /*.filter((item) => {
      const provider = extractAttributeValue(item, FormFields.TrainingProvider.key);
      return (
        !provider ||
        provider === INNER_PROVIDER_KEY ||
        (provider !== INNER_PROVIDER_KEY && inventoryEntries[item.sku])
      );
    })*/
    traverse(
      // when schedule selector is present we traverse all results, despite the inventory presence
      isScheduleFieldPresent
        ? snapshotFilteredThirdParty
        : snapshotFilteredThirdParty.filter((item) => inventoryEntries?.[item.sku])
    );
    setFacetListSnapshot((data) => {
      const dataArray = Object.keys(data);
      const facetArray = Object.keys(facetResult);
      if (facetArray.length > dataArray.length) {
        return facetResult;
      }
      // we fill in the first data fill in and use it as ethalon
      const isUpdate = Object.keys(facetResult).some((key) => {
        const facetResultLength = facetResult?.[key]?.length;
        const dataLength = data[key]?.length;
        return facetResultLength > 0 && facetResultLength > dataLength;
      });

      return isUpdate ? facetResult : data;
    });

    setFacetList({
      ...searchResults?.currentFacetOptions,
      ...facetResult,
    });
  }, [
    productFormFields,
    inventoryEntries,
    selectedProduct,
    formFieldsDependecy,
    snapshotData,
    searchResults?.currentFacetOptions,
  ]);

  useEffect(() => {
    if (!facetList) {
      return;
    }
    // once we set up facetList, we init the state for conditionally required fields
    const conditionalFields: { [name: string]: boolean | null } = formFieldsDependecy.reduce(
      // build conditional fields data structure
      (acc, item) => {
        return {
          ...acc,
          ...(item.isConditionallyRequired && {
            [item.name]: null,
          }),
        };
      },
      {}
    );
    // set their values
    Object.keys(facetList).forEach((key) => {
      if (conditionalFields[key] !== undefined) {
        const hasUndefined = facetList[key].some((data) => !data.value);
        const hasSomeDefined = facetList[key].some((data) => data.value);
        conditionalFields[key] = hasSomeDefined ? !hasUndefined : null;
      }
    });
    // set their state which is used then in radio and select components to render them correspondingly
    setConditionalFieldsMandatoryState(conditionalFields);
  }, [formFieldsDependecy, facetList, setConditionalFieldsMandatoryState]);

  // indicator when to show prices for bundles/purcahse options in case all necessary fields are pre selected
  const isShowPrices = useMemo(() => {
    const filteredFields = productFormFields.filter((item) => {
      // check whether the item is required
      const requiredState = Boolean(
        item?.isConditionallyRequired
          ? conditionalFieldsMandatoryState[item.name]
          : item?.isRequired
      );

      // as we may have some other fields in scaffold like some headline text records, we apply only those which impact the form search results/select schedule(manual variant selector)
      // form data always have startDate and endDate, they always are either present together or both are not present, so we just check for the first one
      const mandatoryTypes =
        item.type === FormElementTypes.select ||
        item.type === FormElementTypes.radio ||
        item.name === FormFields.StartDate.key;

      // bundles and purchase options are radio selectors, so we exclude them
      const excludedBundleOptions =
        item.name !== FormFields.BundleOptions.key && item.name != FormFields.PurchaseOptions.key;

      // This could be restored in the next project iteration when we turn on filtering by training provider
      // const filterByThirdParty = item.hideForThirdParty || item.hideForThirdParty === undefined;
      return requiredState && mandatoryTypes && excludedBundleOptions /* && filterByThirdParty*/;
    });
    return !filteredFields.some((item) =>
      item.name === FormFields.StartDate.key ? !confirmedDate : !selectedProduct[item.name]
    );
  }, [productFormFields, selectedProduct, confirmedDate, conditionalFieldsMandatoryState]);

  // Manage selected/unselected options in state via callback
  const toggleSelectedProduct = useCallback(
    (productOption: { [key: string]: ProductOptionData }, parentKey?: string) => {
      // if a single selectoOption (result of selector/radio duration field)
      const productOptionKeys = Object.keys(productOption);
      const currentFormFieldIndex = formFieldsDependecy.findIndex(
        (item) => item.name === productOptionKeys[0]
      );
      for (const [key, value] of Object.entries(productOption)) {
        setSelectedProduct((prevSelectedProduct) => {
          const newSelectedProduct = { ...prevSelectedProduct };
          // if we trigger any selector above purchase option in the form we deselect them
          if (key !== FormFields.PurchaseOptions.key) {
            delete newSelectedProduct[FormFields.PurchaseOptions.key];
          }
          // get and delete options according to the field structure to delete based on the selected product option index
          if (currentFormFieldIndex >= 0) {
            Object.keys(newSelectedProduct).forEach((key) => {
              const itemIndex = formFieldsDependecy.findIndex((item) => item.name === key);
              if (itemIndex >= currentFormFieldIndex) {
                // we reset date along with the upper field, within the case of triggering field itself
                setConfirmedDate((date) => {
                  const isNull = date === null;
                  if (!isNull) {
                    delete newSelectedProduct[FormFields.StartDate.key];
                    delete newSelectedProduct[FormFields.EndDate.key];
                  }
                  return isNull ? date : null;
                });
              }
              if (itemIndex > currentFormFieldIndex) {
                // we delete further field in the options
                delete newSelectedProduct[key];
              }
            });
          }

          // Delete from object if same value already exist
          if (!parentKey && value?.value === prevSelectedProduct[key]?.data?.value) {
            delete newSelectedProduct[key];
            return newSelectedProduct;
          }
          const result = {
            ...newSelectedProduct,
            ...(!parentKey && {
              [key]: {
                data: value,
              },
            }),
            ...(parentKey && {
              [parentKey]: {
                ...newSelectedProduct?.[parentKey],
                options: {
                  ...newSelectedProduct?.[parentKey]?.options,
                  ...(key && { [key as string]: value }),
                },
              },
            }),
          };

          // delete necessary suboptions of the new constructed object
          const optionValue =
            newSelectedProduct[parentKey as keyof ProductOptions]?.options?.[key]?.value;
          if (parentKey && value?.value && value?.value === optionValue) {
            const obj: ProductOptionValue = result[parentKey as keyof ProductOptions];
            if (obj.options?.[key]) {
              delete obj.options[key];
            }
            if (obj.options && !Object.keys(obj.options).length) {
              delete obj.options;
            }
          }
          return result;
        });
      }
    },
    [formFieldsDependecy]
  );

  const presetSelectedProduct = useCallback((options: ProductOptions) => {
    setSelectedProduct((prev) => ({ ...prev, ...options }));
  }, []);

  useEffect(() => {
    // if confirmed date(schedule variant selector) was updated, we update selectedProduct state with its value
    if (confirmedDate?.isoStart !== undefined && confirmedDate?.isoEnd !== undefined) {
      toggleSelectedProduct({
        startDate: { value: confirmedDate?.isoStart, noAlgoliaConnection: true },
        endDate: { value: confirmedDate?.isoEnd, noAlgoliaConnection: true },
      });
    }
  }, [confirmedDate, toggleSelectedProduct]);

  // set up the confirmed date, in case if the new selected variant has the same sku, we just leave it as it is
  const updateConfirmedDate = useCallback((newDate: ProductDate | null) => {
    setConfirmedDate((oldDate) => (oldDate?.sku === newDate?.sku ? oldDate : newDate));
  }, []);

  // if we get new list of purschase option prices - we update the selected options in selectedProduct with their values
  useEffect(() => {
    if (productFieldPrices) {
      setSelectedProduct((prevSelectedProduct) => {
        const newSelectedProduct = { ...prevSelectedProduct };
        const isUpdating = !Object.keys(prevSelectedProduct)?.some((key) => {
          const prevData = newSelectedProduct?.[key]?.data;
          const prevDataCurrency = prevData?.price?.currencyCode;
          const prevDataValue = prevData?.value;

          const productNewData = productFieldPrices?.[key]?.find(
            (item) => item.value === prevDataValue
          );
          const productNewDataCurrency = productNewData?.price?.currencyCode;
          return productNewDataCurrency && productNewDataCurrency !== prevDataCurrency;
        });

        if (!isUpdating) {
          return prevSelectedProduct;
        }

        const result = Object.keys(newSelectedProduct).reduce((acc, key) => {
          const selectedFieldValue = productFieldPrices[key]?.find(
            (item) => item.value === newSelectedProduct[key]?.data?.value
          );
          if (selectedFieldValue) {
            const noAlgoliaConnection = newSelectedProduct[key].data.noAlgoliaConnection;
            const addOnOptions = newSelectedProduct[key]?.options;
            const newAddOnData = selectedFieldValue?.addOn?.reduce((addOnAcc, addOnItem) => {
              if (addOnOptions?.[addOnItem.value]) {
                return {
                  ...addOnAcc,
                  [addOnItem.value]: {
                    noAlgoliaConnection: addOnOptions?.[addOnItem.value]?.noAlgoliaConnection,
                    price: addOnItem.price,
                    value: addOnItem.value,
                  },
                };
              }
              return addOnAcc;
            }, {});
            return {
              ...acc,
              [key]: {
                data: {
                  noAlgoliaConnection,
                  price: selectedFieldValue.price,
                  value: selectedFieldValue.value,
                },
                ...(addOnOptions && { options: newAddOnData }),
              },
            };
          }
          return {
            ...acc,
            [key]: newSelectedProduct[key],
          };
        }, {});

        return isEqual(result, prevSelectedProduct) ? prevSelectedProduct : result;
      });
    }
  }, [productFieldPrices, setSelectedProduct]);

  useEffect(() => {
    const scheduleEntireList: ProductDate[] = [];
    const now = new Date();
    scheduleData?.forEach((item) => {
      item?.dates
        .filter((date) => date?.isoStart && new Date(date.isoStart) >= now)
        .forEach((date) => scheduleEntireList.push(date));
    });
    if (!scheduleEntireList?.length) {
      updateConfirmedDate(null);
    }
  }, [scheduleData, updateConfirmedDate]);

  // initial point of provider, where we apply the first necessary attribute - the product key assigned throught sitecore
  // also used during facet selection

  useEffect(() => {
    if (!productKey || bundlePdpData || isProductSetMode) {
      // if we do not have product key, or if we loaded bundle-pdp or product set - we do not make search fetch again
      // as there are no facets
      return;
    }
    // we perform basic search to get first information of the data and its relation to the flow fork
    getSearchResults({ facets: [...selectedProductFacets], productKeys: [productKey] });
  }, [getSearchResults, productKey, bundlePdpData, selectedProductFacets, isProductSetMode]);

  // we make schedule selector selectable only when others fields are selected,
  // which are marked as isConfigurationOption in scaffold
  useEffect(() => {
    const configurationFields = formFieldsDependecy.filter((item) => {
      const requiredStateCheck = item.isConditionallyRequired
        ? conditionalFieldsMandatoryState[item.name]
        : item.isRequired;
      // This could be restored in the next project iteration when we turn on filtering by training provider
      /*
        const thirdPartyCheck =
        item.hideForThirdParty === undefined ||
        (isThirdPartyProvider ? item.hideForThirdParty === false : item.hideForThirdParty);
      */
      return item.isConfigurationOption && requiredStateCheck /* && thirdPartyCheck*/;
    });
    setIsProductConfigured(
      !configurationFields?.some((item) => selectedProduct[item.name] === undefined)
    );
  }, [
    selectedProduct,
    formFieldsDependecy,
    conditionalFieldsMandatoryState,
    /* isThirdPartyProvider */
  ]);

  // gather purchase options data from object fields "value" and "options" to map corresponding prices
  const getSelectedOptionsList = useCallback(
    (key: string): string[] => {
      const selectedProductValue = selectedProduct?.[key]?.data?.value as string;
      const selectedProductOptions = selectedProduct?.[key]?.options as {
        [key: string]: ProductOptionData;
      };

      return [
        selectedProductValue,
        ...(selectedProductOptions
          ? Object.values(selectedProductOptions).map((item) => item.value as string)
          : []),
      ];
    },
    [selectedProduct]
  );

  useEffect(() => {
    const hasPriceOptions = productFormFields?.some(
      (item) =>
        item.name === FormFields.PurchaseOptions.key || item.name === FormFields.BundleOptions.key
    );
    const purchaseOptionsSelectedList = getSelectedOptionsList(FormFields.PurchaseOptions.key);
    const bundleOptionsSelectedList = getSelectedOptionsList(FormFields.BundleOptions.key);
    const list = [...purchaseOptionsSelectedList, ...bundleOptionsSelectedList].filter(Boolean);
    const singleSkuResult = productVariants?.length === 1 ? productVariants[0].sku : null;

    // here we store final selected options, taking it from corresponding case/source
    setSelectedOptionSkus(
      hasPriceOptions && list?.length
        ? list
        : singleSkuResult
        ? [singleSkuResult]
        : confirmedDate?.sku
        ? [confirmedDate?.sku]
        : []
    );
  }, [
    productFormFields,
    confirmedDate?.sku,
    selectedProduct,
    productVariants,
    getSelectedOptionsList,
  ]);

  // check on banned tier, to not allow user from the banned list countries proceed with purchase
  const isBannedTier = useMemo(() => {
    const channels = distributionChannel?.channels;
    const geoLocationChannel = channels && getChannel(channels, geolocationCountry);

    // check on geolocation for banned tier
    const isGeoLocationForbidden = Boolean(
      geoLocationChannel?.key && CT_BANNED_TIERS.includes(geoLocationChannel.key)
    );
    // check on user country OR geolocation from channel service
    const priceFlowLocationForbidden = Boolean(
      distributionChannel?.key && CT_BANNED_TIERS.includes(distributionChannel.key)
    );

    return isGeoLocationForbidden || priceFlowLocationForbidden;
  }, [distributionChannel, geolocationCountry]);

  // form validation value
  const formFieldsAreValid = useMemo(() => {
    const allFields = productFormFields?.filter((item) => {
      const requiredStateCheck = item.isConditionallyRequired
        ? conditionalFieldsMandatoryState[item.name]
        : item.isRequired;

      // This could be restored in the next project iteration when we turn on filtering by training provider
      /*
      const thirdPartyCheck =
        item.hideForThirdParty === undefined ||
        (isThirdPartyProvider ? item.hideForThirdParty === false : item.hideForThirdParty);
      */
      return requiredStateCheck /* && thirdPartyCheck*/;
    });
    return allFields?.reduce((acc, item) => {
      const selectedFilter = selectedProduct[item.name];
      const priceData = productFieldPrices?.[item.name]?.find(
        (item) => item?.value === selectedFilter?.data?.value
      );

      const checkSource =
        item.type === FormElementTypes.schedule
          ? confirmedDate
          : item.name !== FormFields.BundleOptions.key &&
            item.name !== FormFields.PurchaseOptions.key
          ? selectedFilter
          : (selectedFilter?.data?.value && priceData?.price) ||
            (selectedFilter?.options &&
              Object.keys(selectedFilter.options).every((optionSku) =>
                priceData?.addOn?.some(
                  (priceData) => priceData.value === optionSku && priceData?.price
                )
              ));

      if (checkSource) {
        return acc;
      }
      return false;
    }, true);
  }, [
    productFormFields,
    conditionalFieldsMandatoryState,
    //isThirdPartyProvider,
    selectedProduct,
    confirmedDate,
    productFieldPrices,
  ]);

  // summary price - used for summary price component in pdp pages
  const currentPrice = useMemo(() => {
    // if no productPrices received from the service layer - we return empty price structure
    if (!productPrices) {
      return {};
    }

    const skus = (
      (selectedOptionSkus?.length && selectedOptionSkus) || // if we directly select variant in radio selector
      (confirmedDate?.sku && [confirmedDate?.sku]) || // or if we select variant via schedule selector
      productVariants?.map((item) => item.sku) || // list of found variants skus
      []
    ).filter(
      (item) => item !== FormAdditionalData.SelectProducts.key
      // some pdp page may use one of the key labels above as an opener for multiselection blocks (like productSet for example), we just filter those non-sku values out
    );

    // building price structure by iterating user roles (prices for each role)
    return Object.values(CUSTOMER_PRICING_GROUP_MAP).reduce((acc, role) => {
      const optionPrices = new Map<string, ProductPrice>(); // collection of prices for each selected product variant
      const optionDiscounts = new Map<string, ProductPrice>(); // collection of discounted prices for each selected product variant

      // collect price of items within a role
      skus.forEach((sku) => {
        const priceValue = productPrices[sku]?.[role]?.value;
        const discountValue = productPrices[sku]?.[role]?.discounted?.value;
        const price = priceValue && correctDigits(priceValue); // correctDigits is used for price correction in case of different fractionDigits values
        const discountPrice = discountValue && correctDigits(discountValue);

        if (price) {
          optionPrices.set(sku, price);
        }
        if (discountPrice) {
          optionDiscounts.set(sku, discountPrice);
        }
      });

      // isCombineMode represents case when we have several selected items(bundles for example)
      // and some of the items have discount price, and some - just price, we should combine them
      const isCombineMode = optionPrices.size > 1 && Boolean(optionDiscounts.size);

      const options: ProductPrice[] = []; // array of combined option prices
      const discounts: ProductPrice[] = []; // array of combined discount prices

      // as discounts are always going together with prices, we iterate one time throught the collected prices
      // and fill corresponding arrays with updated prices
      optionPrices.forEach((value, key) => {
        options.push(value);
        const discountData = optionDiscounts.get(key);
        if (isCombineMode) {
          discounts.push(discountData ? discountData : value);
        } else if (discountData) {
          discounts.push(discountData);
        }
      });

      return {
        ...acc,
        [role]: {
          ...(options?.length && { value: getAccumulatedPrice(options, currencyCode) }), // make a sum of all collected prices
          ...(discounts?.length && {
            discounted: {
              value: getAccumulatedPrice(discounts, currencyCode), // make a sum of all collected discounts
            },
          }),
        },
      };
    }, {});
  }, [confirmedDate?.sku, productVariants, productPrices, currencyCode, selectedOptionSkus]);

  const priceTitles = useMemo(
    () => ({
      regularPriceText: rendering?.fields?.regularPriceText as Field<string>,
      memberPriceText: rendering?.fields?.memberPriceText as Field<string>,
      candidatePriceText: rendering?.fields?.candidatePriceText as Field<string>,
      associatePriceText: rendering?.fields?.associatePriceText as Field<string>,
      isForFreeText: rendering?.fields?.isForFreeText as Field<string>,
    }),
    [
      rendering?.fields?.regularPriceText,
      rendering?.fields?.memberPriceText,
      rendering?.fields?.candidatePriceText,
      rendering?.fields?.associatePriceText,
      rendering?.fields?.isForFreeText,
    ]
  );

  return (
    <ProductFormContext.Provider
      value={{
        rendering,
        priceTitles,
        isThirdPartyProvider,
        selectedProduct,
        toggleSelectedProduct,
        presetSelectedProduct,
        confirmedDate,
        updateConfirmedDate,
        currentPrice,
        scheduleData,
        setScheduleData,
        setProductFormFields,
        productFormFields,
        productFieldPrices,
        modalContent,
        setModalContent,
        isProductConfigured,
        facetList,
        conditionalFieldsMandatoryState,
        formFieldsDependecy,
        isShowPrices,
        formFieldsAreValid,
        priceRoleKey,
        inventoryEntries,
        setSelectedOptionSkus,
        selectedOptionSkus,
        setOptionPriceData,
        snapshotData,
        productVariants,
        facetListSnapshot,
        isSearchError,
        allocationId,
        setAllocationId,
        isRedeemingCompleted,
        setIsRedeemingCompleted,
        bundlePdpData,
        bundleOptions,
        setProductKey,
        productKey,
        isProductSetMode,
        bundleProductKeyItemSkusMap,
        isBannedTier,
      }}
    >
      {children}
    </ProductFormContext.Provider>
  );
};

const useProductForm = () => useContext(ProductFormContext);

export { ProductFormProvider, useProductForm };
