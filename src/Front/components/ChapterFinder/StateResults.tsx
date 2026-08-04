import { useCallback, useContext, useEffect, useState } from 'react';
import { useAnalyticsTracking } from 'hooks/index';
import { LocationContext } from 'providers/userLocation';
import { Hit } from 'react-instantsearch-core';
import measureDistance from 'utils/measureDistance';
import { ANALYTICS_EVENTS } from 'constants/index';

interface StateResultsProps {
  hit: Hit<field>;
}

interface field {
  city: string;
  contactEmail: string;
  contactName: string;
  country: string;
  stateProvince: string;
  website: string;
  name: string;
  location: string;
}

const StateResults = ({ hit }: StateResultsProps) => {
  const { track } = useAnalyticsTracking();
  const { userLocation, locationDetectionInitiated, setChaptersInRange } =
    useContext(LocationContext);
  const [isWithinRange, setIsWithinRange] = useState(false);

  const { city, contactEmail, contactName, country, stateProvince, website, name, location } = hit;

  useEffect(() => {
    if (userLocation && location) {
      const { latitude: userLat, longitude: userLong } = userLocation;

      const locationParts = location.split(',');
      if (locationParts.length === 2) {
        const hitLat = parseFloat(locationParts[0]);
        const hitLong = parseFloat(locationParts[1]);

        if (!isNaN(hitLat) && !isNaN(hitLong)) {
          measureDistance(userLat, userLong, hitLat, hitLong, 'M', () => {
            setIsWithinRange(true);
            setChaptersInRange((prev) => prev + 1);
          });
        }
      }
    }
  }, [userLocation, location, setChaptersInRange]);

  const trackChapterPressed = useCallback(
    (type: string) => {
      const tracking = {
        event: ANALYTICS_EVENTS.GA_EVENT,
        type: 'engagement',
        chapter_finder_form_country: country,
        chapter_finder_form_state: stateProvince,
        chapter_finder_map_city: city,
        bo1: true,
        bo3: true,
      };
      if (type === 'email') {
        return track({ subtype: 'chapter_finder_contact_click', ...tracking });
      }
      return track({
        subtype: 'chapter_finder_chapter_url_click',
        click_url: website,
        ...tracking,
      });
    },
    [track, country, stateProvince, city, website]
  );

  if (locationDetectionInitiated && !isWithinRange) {
    return null;
  }

  return (
    <div
      className={`chapter py-10 border-b border-gray-20 border-solid divide-y-1 w-auto lg:w-[512px]`}
    >
      <h4 className="text-lg font-semibold">{name}</h4>
      <div className="text-base">
        <span>
          {city}, {stateProvince}, {country}
        </span>
      </div>
      <div className="text-base">Contact: {contactName}</div>
      <div className="text-base">
        Email:{' '}
        <a onClick={() => trackChapterPressed('email')} href={`mailto:${contactEmail}`}>
          {contactEmail}
        </a>
      </div>
      <div className="text-base font-semibold">
        <a onClick={() => trackChapterPressed('url')} href={website} target="_blank">
          {website}
        </a>
      </div>
    </div>
  );
};

export default StateResults;
