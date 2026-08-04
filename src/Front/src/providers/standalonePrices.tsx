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

  const { standalonePrices, isGettingStandalonePrices, refetch } = useGetStandalonePrices({
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
        const newSkusToFetch = pendingSkus.filter(
          (sku) => !productPrices[sku] && !prevSkusToBeFetched.includes(sku)
        );
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

  useEffect(() => {
    if (standalonePrices !== undefined) {
      setProductPrices((prevProductPrices) => {
        const next = { ...prevProductPrices, ...standalonePrices };
        lastFetchedSkusRef.current.forEach((sku) => {
          if (!(sku in next)) next[sku] = {};
        });
        return next;
      });
    }
  }, [standalonePrices]);

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
