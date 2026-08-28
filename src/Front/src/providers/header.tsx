/* eslint-disable @typescript-eslint/no-empty-function */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { signIn } from 'next-auth/react';

import { HeaderUserLinkField, HeaderUserLinks, MenuItem, Tab, UserLinksFields } from 'types/index';
import {
  useBreakpoint,
  useEscapeKey,
  useLoggedUser,
  useToggle,
  useUserRoleValue,
} from 'hooks/index';
import { useShopperContext } from 'providers/shopperContext';
import { B2B_HIDDEN_NAV_LINKS } from 'constants/index';

type HeaderNavigationContextProps = {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  menuItems: MenuItem[];
  setMenuItems: (value: MenuItem[]) => void;
  selectedMenuItem: MenuItem | null;
  setSelectedMenuItem: (value: MenuItem | null) => void;
  selectedTab: Tab | null;
  setSelectedTab: (value: Tab | null) => void;
  isHovered: boolean;
  setIsHovered: (value: boolean) => void;
  tabs: Tab[] | null;
  setTabs: (value: Tab[]) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (value: boolean) => void;
  toggleSearchOpen: () => void;
  closeNavigation: () => void;
  closeAllNavigation: () => void;
  setMenuItemActive: (item: MenuItem) => void;
  userLinks?: UserLinksFields;
  userLinksForRole?: HeaderUserLinks;
  setUserHeaderLinks: (userLinks: UserLinksFields, headerUserLinks?: HeaderUserLinks[]) => void;
  onUserLinkClick: (loggedInCallback?: () => void) => void;
  isCurrencyBannerOnPage: boolean;
  setIsCurrencyBannerOnPage: (value: boolean) => void;
  userRoleMenuLinks: {
    sectionTitle: string | undefined;
    userLinks: HeaderUserLinkField[];
  };
};

const HeaderNavigationContext = createContext<HeaderNavigationContextProps>({
  isOpen: false,
  setIsOpen: () => {},
  menuItems: [],
  setMenuItems: () => {},
  selectedMenuItem: null,
  setSelectedMenuItem: () => {},
  selectedTab: null,
  setSelectedTab: () => {},
  isHovered: false,
  setIsHovered: () => {},
  tabs: [],
  setTabs: () => {},
  isSearchOpen: false,
  setIsSearchOpen: () => {},
  toggleSearchOpen: () => {},
  closeNavigation: () => {},
  setMenuItemActive: () => {},
  closeAllNavigation: () => {},
  userLinks: undefined,
  userLinksForRole: undefined,
  setUserHeaderLinks: () => {},
  onUserLinkClick: () => {},
  isCurrencyBannerOnPage: false,
  setIsCurrencyBannerOnPage: () => {},
  userRoleMenuLinks: {
    sectionTitle: undefined,
    userLinks: [],
  },
});

type HeaderNavigationProviderProps = {
  children: React.ReactNode;
};

const HeaderNavigationProvider: React.FC<HeaderNavigationProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const [selectedTab, setSelectedTab] = useState<Tab | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [userLinks, setUserLinks] = useState<UserLinksFields>();
  const [headerUserLinks, setHeaderUserLinks] = useState<HeaderUserLinks[]>();
  const [isSearchOpen, toggleSearchOpen, setIsSearchOpen] = useToggle(false);
  const [isCurrencyBannerOnPage, setIsCurrencyBannerOnPage] = useState(false);

  const { isUserLoggedIn, isGettingUser, isB2BAdminUser } = useLoggedUser();
  const { shopperContext } = useShopperContext();
  const breakpoint = useBreakpoint();

  const setUserHeaderLinks = useCallback(
    (userLinks: UserLinksFields, headerUserLinks: HeaderUserLinks[]) => {
      setUserLinks(userLinks);
      setHeaderUserLinks(headerUserLinks);
    },
    []
  );

  const closeNavigation = useCallback(() => {
    setIsOpen(false);
    setSelectedMenuItem(null);
  }, []);

  const closeAllNavigation = useCallback(() => {
    closeNavigation();
    setIsSearchOpen(false);
    setSelectedMenuItem(null);
  }, [closeNavigation, setIsSearchOpen, setSelectedMenuItem]);

  useEscapeKey(closeAllNavigation);

  useEffect(() => {
    const body = document.querySelector('body');

    if (breakpoint === 'sm' && body) {
      body.style.overflow = Boolean(isOpen || isSearchOpen) ? 'hidden' : '';
    }

    if (breakpoint !== 'sm' && body) {
      body.style.overflow = '';
    }
  }, [breakpoint, isOpen, isSearchOpen]);

  useEffect(() => {
    if (isOpen) {
      setIsSearchOpen(false);
    }
  }, [isOpen, setIsSearchOpen]);

  useEffect(() => {
    if (isSearchOpen) {
      closeNavigation();
    }
  }, [isSearchOpen, closeNavigation]);

  const setMenuItemActive = useCallback(
    (item: MenuItem) => {
      if (isOpen && selectedMenuItem === item) {
        return closeNavigation();
      }

      setIsOpen(true);
      setSelectedMenuItem(item);
    },
    [isOpen, selectedMenuItem, closeNavigation]
  );

  const setAndFilterMenuItems = useCallback((items: MenuItem[]) => {
    const filteredItems = items.filter(
      (item) => item.columnLinks.length > 0 || item.tabs.length > 0
    );
    setMenuItems(filteredItems);
  }, []);

  const setAndFilterTabs = useCallback((tabs: Tab[]) => {
    const filteredTabs = tabs.filter((tab) => tab.columnLinks.length > 0);
    setTabs(filteredTabs);
  }, []);

  useEffect(() => {
    if (
      selectedMenuItem &&
      typeof selectedMenuItem === 'object' &&
      selectedMenuItem!.tabs?.length > 0
    ) {
      setAndFilterTabs(selectedMenuItem!.tabs);
    }
  }, [selectedMenuItem, setAndFilterTabs]);

  useEffect(() => {
    if (breakpoint !== 'sm') {
      closeAllNavigation();
    }
  }, [breakpoint, closeAllNavigation]);

  useEffect(() => {
    if (breakpoint !== 'sm' && typeof selectedMenuItem === 'object') {
      setSelectedTab(selectedMenuItem?.tabs[0] || null);
    } else {
      setSelectedTab(null);
    }
  }, [breakpoint, selectedMenuItem]);

  const onUserLinkClick = useCallback(
    (loggedInCallback?: () => void) => {
      if (isGettingUser) {
        return;
      }

      if (isUserLoggedIn && loggedInCallback) {
        return loggedInCallback();
      }

      const { href } = window.location;
      const callbackUrl = new URL(href).searchParams.get('callbackUrl') || undefined;

      signIn('salesforce', { callbackUrl });
    },
    [isUserLoggedIn, isGettingUser]
  );

  const userLinksSectionId = useUserRoleValue({
    memberValue: userLinks?.memberLinksSection.id,
    candidateValue: userLinks?.candidateLinksSection.id,
    associateValue: userLinks?.associateLinksSection.id,
    nonMemberValue: userLinks?.registerUserLinksSection.id,
  });

  const userLinksForRole = useMemo(() => {
    if (!userLinksSectionId || !headerUserLinks?.length) {
      return undefined;
    }

    const userRoleData = headerUserLinks.find((section) => section.id === userLinksSectionId);
    if (isB2BAdminUser) {
      const b2bAdminData = headerUserLinks.find(
        (section) => section.id === userLinks?.b2bAdminLinksSection.id
      );

      // Merge arrays and remove duplicated links
      const menuLinks = [
        ...(userRoleData?.children[0]?.children || []),
        ...(b2bAdminData?.children[0]?.children || []),
      ].filter(
        (value, index, self) => index === self.findIndex((item) => item.name === value.name)
      );

      return {
        ...b2bAdminData,
        children: [{ ...b2bAdminData?.children[0], children: menuLinks }],
      } as HeaderUserLinks;
    }

    return userRoleData;
  }, [userLinksSectionId, headerUserLinks, isB2BAdminUser, userLinks?.b2bAdminLinksSection.id]);

  const userRoleMenuLinks = useMemo(() => {
    if (!userLinksForRole) {
      return {
        sectionTitle: undefined,
        userLinks: [],
      };
    }

    const [linksInfo] = userLinksForRole.children;
    const isBusinessBuyingSession = shopperContext?.type === 'organization';

    return {
      sectionTitle: linksInfo?.fields?.userSectionName?.value || '',
      userLinks: linksInfo?.children.filter(
        (item) =>
          item?.fields?.link?.value?.text &&
          item?.fields?.link?.value?.href &&
          !(isBusinessBuyingSession && B2B_HIDDEN_NAV_LINKS.includes(item.name))
      ),
    };
  }, [userLinksForRole, shopperContext?.type]);

  return (
    <HeaderNavigationContext.Provider
      value={{
        isOpen,
        setIsOpen,
        menuItems,
        setMenuItems: setAndFilterMenuItems,
        selectedMenuItem,
        setSelectedMenuItem,
        selectedTab,
        setSelectedTab,
        isHovered,
        setIsHovered,
        tabs,
        setTabs: setAndFilterTabs,
        isSearchOpen,
        setIsSearchOpen,
        toggleSearchOpen,
        closeNavigation,
        setMenuItemActive,
        closeAllNavigation,
        userLinks,
        setUserHeaderLinks,
        onUserLinkClick,
        userLinksForRole,
        isCurrencyBannerOnPage,
        userRoleMenuLinks,
        setIsCurrencyBannerOnPage,
      }}
    >
      {children}
    </HeaderNavigationContext.Provider>
  );
};

const useHeaderNavigation = () => useContext(HeaderNavigationContext);

export { HeaderNavigationProvider, useHeaderNavigation };
