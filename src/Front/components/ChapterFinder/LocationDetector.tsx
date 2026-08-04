import React, { useState, useCallback, useContext } from 'react';
import { LocationContext } from 'providers/userLocation';
import GlobeIcon from 'icons/GlobeIcon';

interface LocationDetectorProps {
  setIsselect?: (value: string) => void;
  setIsclear?: (value: boolean) => void;
}

const LocationDetector: React.FC<LocationDetectorProps> = ({ setIsselect, setIsclear }) => {
  const [locationStatus, setLocationStatus] = useState<'idle' | 'searching' | 'failed'>('idle');

  const { setUserLocation, setLocationDetectionInitiated, locationDetectionInitiated } =
    useContext(LocationContext);

  const handleButtonClear = useCallback(() => {
    if (setLocationDetectionInitiated) {
      setLocationDetectionInitiated(false);
    }
    if (setIsclear && setIsselect) {
      setIsselect('');
      setIsclear(true);
    }
  }, [setLocationDetectionInitiated, setIsselect, setIsclear]);

  const detectLocation = useCallback(() => {
    if (setLocationDetectionInitiated) {
      setLocationDetectionInitiated(true);
    }
    setLocationStatus('searching');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (setUserLocation) {
            setUserLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          }
          setLocationStatus('idle');
        },
        (error) => {
          console.error('Error occurred while obtaining geolocation:', error);
          setLocationStatus('failed');
          if (setUserLocation) {
            setUserLocation(undefined);
          }
        }
      );
    } else {
      console.log('Geolocation is not supported by this browser.');
      setLocationStatus('failed');
      if (setUserLocation) {
        setUserLocation(undefined);
      }
    }
  }, [setUserLocation, setLocationDetectionInitiated]);

  const detectingLocationText = 'Detecting your location...';
  const failedToDetectLocationText = 'Failed to detect location.';
  const useMyPreciseLocationText = 'Use My Precise Location';
  const clearButtonText = 'Clear';

  return (
    <div>
      {locationStatus === 'searching' && (
        <p className="block text-link-blue flex items-center justify-center mt-4">
          {detectingLocationText}
        </p>
      )}
      {locationStatus === 'failed' && (
        <p className="block text-link-blue flex items-center justify-center mt-4">
          {failedToDetectLocationText}
        </p>
      )}
      {locationDetectionInitiated === false ? (
        <button
          className="block text-link-blue flex items-center justify-center mt-4"
          onClick={detectLocation}
          aria-label={useMyPreciseLocationText}
        >
          <span className="text">{useMyPreciseLocationText}</span>
          <span className="icon pl-2">
            <GlobeIcon size={16} />
          </span>
        </button>
      ) : (
        <button
          className="mt-4 block font-semibold"
          onClick={handleButtonClear}
          aria-label={clearButtonText}
        >
          {clearButtonText}
        </button>
      )}
    </div>
  );
};

export default LocationDetector;
