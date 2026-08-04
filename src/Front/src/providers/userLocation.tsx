import React, { useState, createContext, ReactNode, Dispatch, SetStateAction } from 'react';

type UserLocationState =
  | {
      latitude: number;
      longitude: number;
    }
  | undefined;

interface LocationContextType {
  userLocation: UserLocationState;
  locationDetectionInitiated: boolean;
  chaptersInRange: number;
  setUserLocation: (location: UserLocationState) => void;
  setLocationDetectionInitiated: (initiated: boolean) => void;
  setChaptersInRange: Dispatch<SetStateAction<number>>;
}

export const LocationContext = createContext<LocationContextType>({
  userLocation: undefined,
  locationDetectionInitiated: false,
  chaptersInRange: 0,
  setUserLocation: () => {
    console.warn('setUserLocation function not implemented');
  },
  setLocationDetectionInitiated: () => {
    console.warn('setLocationDetectionInitiated function not implemented');
  },
  setChaptersInRange: () => {
    console.warn('setChaptersInRange function not implemented');
  },
});

interface LocationProviderProps {
  children: ReactNode;
}

export const LocationProvider: React.FC<LocationProviderProps> = ({ children }) => {
  const [userLocation, setUserLocation] = useState<UserLocationState>(undefined);
  const [locationDetectionInitiated, setLocationDetectionInitiated] = useState(false);
  const [chaptersInRange, setChaptersInRange] = useState(0);

  return (
    <LocationContext.Provider
      value={{
        userLocation,
        locationDetectionInitiated,
        chaptersInRange,
        setUserLocation,
        setLocationDetectionInitiated,
        setChaptersInRange,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};
