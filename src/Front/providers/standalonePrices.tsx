/* eslint-disable @typescript-eslint/no-empty-function */
import {
  useGetDistributionChannel,
  useGetStandalonePrices,
  useGetSubscriptions,
  useLoggedUser,
} from 'hooks/index';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useRouter } from 'next/router';
import { StandalonePriceMapping } from 'types/pricing';
import { useUserSession } from './userSession';

export type PriceForRole = {
  forRegularUser: boolean;
  forMemberUser: boolean;
  forAssociateUser: boolean;
  forCandidateUser: boolean;
};

type StandalonePricesContextProps = {
  productPrices: StandalonePriceMapping;
  isGettingStandalonePrices: boolean;
  pendingStandalonePriceSkus: string[];
  addSkuToPricingQueue: (sku: string[]) => void;
  showPriceForRole: PriceForRole;
  isGettingPricesForRole: boolean;
};

const StandalonePricesContext = createContext<StandalonePricesContextProps>({
  productPrices: {},
  isGettingStandalonePrices: false,
  pendingStandalonePriceSkus: [],
  addSkuToPricingQueue: () => {},
  showPriceForRole: {
    forRegularUser: true,
    forMemberUser: false,
    forAssociateUser: false,
    forCandidateUser: false,
  },
  isGettingPricesForRole: true,
});

type StandalonePricesProviderProps = {
  children: React.ReactNode;
};

// The commercetools standalone-price query takes its SKUs as a literal `sku in ("a", "b", …)`
// predicate, so the queue must never be flushed as one unbounded request: a few hundred SKUs
// produce an enormous predicate and a long serial page-walk, and past a certain size the query is
// rejected outright — which strands those SKUs permanently unpriced, since the query does not
// retry. The B2B PLP's price sort queues its entire result set at once (hundreds of SKUs, most of
// all right after Clear), so the queue is drained in bounded waves instead: the effect below
// re-runs as each wave lands and picks up the next one.
//
// Waves are sequential, so the size is a balance: small enough that the predicate stays modest,
// large enough that a big queue does not turn into a long chain of waves. 250 SKUs is roughly a
// 6KB predicate, and (since the pages within a wave are now fetched in parallel) each wave costs
// about two round trips no matter how many price rows it returns.
const PRICING_FETCH_BATCH_SIZE = 250;

const StandalonePricesProvider: React.FC<StandalonePricesProviderProps> = ({ children }) => {
  const { distributionChannel, isGettingDistributionChannel } = useGetDistributionChannel();
  const { currencyCode } = useUserSession();
  const {
    isRegisterUser,
    isUserNotLoggedIn,
    isUserMember,
    isUserAssociate,
    isUserCandidate,
    isB2BAdminUser,
    isGettingUser,
  } = useLoggedUser();
  const { isGettingSubscriptions, isSuspended } = useGetSubscriptions();

  const [pendingSkus, setPendingSkus] = useState<string[]>([]);
  const [skusToBeFetched, setSkusToBeFetched] = useState<string[]>([]);
  const [productPrices, setProductPrices] = useState<StandalonePriceMapping>({});

  const isFetchQueued = useRef(false);
  const lastFetchedSkusRef = useRef<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    const handleRouteChange = () => {
      isFetchQueued.current = false;
      setPendingSkus([]);
      setSkusToBeFetched([]);
    };
    router.events.on('routeChangeStart', handleRouteChange);
    return () => router.events.off('routeChangeStart', handleRouteChange);
  }, []);

  const { standalonePrices, isGettingStandalonePrices, refetch, standalonePricesError } =
    useGetStandalonePrices({
      skuList: skusToBeFetched,
      distributionChannelId: distributionChannel?.id,
      enabled: false,
    });

  // Prices rules used for PDP, PLP and analytics
  const showPriceForRole = useMemo(() => {
    return {
      forRegularUser: Boolean(isSuspended || isRegisterUser || isUserNotLoggedIn || isB2BAdminUser),
      forCandidateUser: Boolean(
        !isSuspended && (isUserNotLoggedIn || isUserCandidate || isB2BAdminUser)
      ),
      forMemberUser: Boolean(!isSuspended && (isUserNotLoggedIn || isUserMember || isB2BAdminUser)),
      forAssociateUser: Boolean(!isSuspended && isUserAssociate),
    };
  }, [
    isB2BAdminUser,
    isRegisterUser,
    isSuspended,
    isUserAssociate,
    isUserCandidate,
    isUserMember,
    isUserNotLoggedIn,
  ]);

  const pendingStandalonePriceSkus = useMemo(() => {
    return isGettingStandalonePrices ? skusToBeFetched : [];
  }, [skusToBeFetched, isGettingStandalonePrices]);

  const resetPrices = useCallback(() => {
    isFetchQueued.current = false;
    setSkusToBeFetched([]);
    setProductPrices({});
  }, []);

  useEffect(() => {
    if (currencyCode && distributionChannel?.id) {
      resetPrices();
    }
  }, [currencyCode, distributionChannel?.id, resetPrices]);

  const addSkuToPricingQueue = useCallback((skus: string[]) => {
    setPendingSkus((prev) => {
      const newSkus = skus.filter((sku) => !prev.includes(sku));
      return newSkus.length ? [...prev, ...newSkus] : prev;
    });
  }, []);

  useEffect(() => {
    if (!isGettingStandalonePrices && !isFetchQueued.current) {
      setSkusToBeFetched((prevSkusToBeFetched) => {
        const newSkusToFetch = pendingSkus
          .filter((sku) => !productPrices[sku] && !prevSkusToBeFetched.includes(sku))
          .slice(0, PRICING_FETCH_BATCH_SIZE);
        return newSkusToFetch.length ? newSkusToFetch : prevSkusToBeFetched;
      });
    }
  }, [pendingSkus, productPrices, isGettingStandalonePrices]);

  useEffect(() => {
    if (skusToBeFetched.length) {
      lastFetchedSkusRef.current = skusToBeFetched;
      isFetchQueued.current = true;
      refetch();
    }
  }, [skusToBeFetched, refetch]);

  useEffect(() => {
    if (isGettingStandalonePrices) {
      isFetchQueued.current = false;
    }
  }, [isGettingStandalonePrices]);

  // Closes out the batch in `lastFetchedSkusRef`: merges whatever prices came back and records
  // every SKU of that batch the response did not price as resolved-with-no-price. Without that
  // sentinel a consumer waiting on a SKU appearing in `productPrices` would wait forever (the B2B
  // PLP price sort holds its rows until every SKU resolves) and the queue would never advance past
  // it — the query does not retry (`retry: false`), so nothing else would ever fill the gap.
  const settleFetchedBatch = useCallback((fetched?: StandalonePriceMapping) => {
    setProductPrices((prevProductPrices) => {
      const next = { ...prevProductPrices, ...fetched };
      lastFetchedSkusRef.current.forEach((sku) => {
        if (!(sku in next)) next[sku] = {};
      });
      return next;
    });
  }, []);

  useEffect(() => {
    if (!standalonePricesError || !lastFetchedSkusRef.current.length) {
      return;
    }

    settleFetchedBatch();
  }, [standalonePricesError, settleFetchedBatch]);

  useEffect(() => {
    if (standalonePrices !== undefined) {
      settleFetchedBatch(standalonePrices);
    }
  }, [standalonePrices, settleFetchedBatch]);

  return (
    <StandalonePricesContext.Provider
      value={{
        productPrices,
        isGettingStandalonePrices,
        pendingStandalonePriceSkus,
        addSkuToPricingQueue,
        showPriceForRole,
        isGettingPricesForRole:
          isGettingUser ||
          isGettingSubscriptions ||
          isGettingStandalonePrices ||
          isGettingDistributionChannel,
      }}
    >
      {children}
    </StandalonePricesContext.Provider>
  );
};

const useStandalonePrices = () => useContext(StandalonePricesContext);

export { StandalonePricesProvider, useStandalonePrices };
