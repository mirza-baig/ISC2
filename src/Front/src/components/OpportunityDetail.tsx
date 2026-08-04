import { LinkField, Link } from '@sitecore-jss/sitecore-jss-nextjs';
import { ComponentRendering, Field, RouteData } from '@sitecore-jss/sitecore-jss-nextjs';
import { ComponentProps } from 'lib/component-props';
import { RichText } from '@sitecore-jss/sitecore-jss-nextjs';
import { useRouter } from 'next/router';

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

interface ApiResponse {
  data: {
    contextItem: {
      id: string;
      name: string;
      fields: Array<{
        name: string;
        jsonValue: {
          value: string;
        };
      }>;
    };
  };
}

type FieldValue = string | boolean | [key: string] | FieldValue[];

interface FieldJsonValueType {
  value: FieldValue;
  id?: string;
  url?: string;
  name?: string;
  displayName?: string;
  fields?: { [key: string]: FieldJsonValueType };
}

interface FieldsMap {
  [key: string]: FieldJsonValueType;
}

export type OpportunityDetailProps = ComponentProps & {
  rendering: ComponentRendering | RouteData;
  fields?: {
    Title: Field<string>;
    purpose: Field<string>;
    responsibilities: Field<string>;
    isc2MembershipRequired: Field<boolean>;
    skillsRequired: Field<string>;
    timeRequired: Field<string>;
    startDate: Field<string>;
    endDate: Field<string>;
    contact: Field<string>;
    cpeCredits: Field<string>;
    cpeSubmissionProcess: Field<string>;
    benefits: Field<string>;
    signUp: Field<string>;
    signUpCTA: LinkField;
  };
};

function OpportunityDetail(): JSX.Element | null {
  const [apiData, setApiData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const { asPath } = router;

  const fetchVolunteerFields = useCallback(
    async (urlParam: string) => {
      try {
        const { data } = await axios<ApiResponse>({
          method: 'GET',
          url: `/api/volunteerfields/?pagepath=${urlParam}`,
          headers: {
            'content-type': 'application/json',
          },
        });
        setApiData(data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch Volunteer fields. Please try again later.');
        setLoading(false);
      }
    },
    [setApiData]
  );

  useEffect(() => {
    if (asPath) {
      fetchVolunteerFields(asPath);
    }
  }, [asPath, fetchVolunteerFields]);

  if (loading || !apiData) return <div></div>;
  if (error) return <div>{error}</div>;

  const TITLES = {
    PURPOSE: 'Purpose',
    RESPONSIBILITIES: 'Responsibilities',
    MEMBERSHIP_REQUIRED: 'ISC2 Membership Required',
    SKILLS_REQUIRED: 'Skills Required',
    TIME_REQUIRED: 'Time Required',
    START_END_DATE: 'Start/End Date',
    START_DATE: 'Start Date: ',
    END_DATE: 'End Date: ',
    CONTACT: 'Contact',
    CPE_CREDITS: 'CPE Credits',
    CPE_SUBMISSION_PROCESS: 'CPE Submission Process',
    BENEFITS: 'Benefits',
    SIGN_UP: 'Sign Up',
  };

  const itemFields = apiData.data.contextItem.fields.reduce((acc: FieldsMap, field) => {
    acc[field.name] = field.jsonValue;
    return acc;
  }, {});

  const renderSignUpCTA = () => {
    const signUpCTA = itemFields.signUpCTA?.value;

    if (
      typeof signUpCTA === 'object' &&
      signUpCTA !== null &&
      'href' in signUpCTA &&
      'text' in signUpCTA
    ) {
      const linkField = {
        href: signUpCTA?.href as string,
        text: signUpCTA?.text as string,
        class: 'primary-cta truncate',
      };

      return (
        <div className="pb-4">
          <h2>{TITLES.SIGN_UP}</h2>
          <Link field={linkField} />
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col pb-10 px-5 sm:px-16 sm:pb-10 bg-transparent text-black-100">
      <div className="rich-text slider-scrollbar cursor-auto">
        <div className="pb-4">
          <h2>{TITLES.PURPOSE}</h2>
          <RichText
            field={{
              value: typeof itemFields.purpose?.value === 'string' ? itemFields.purpose?.value : '',
            }}
          />
        </div>
        <div className="pb-4">
          <h2>{TITLES.RESPONSIBILITIES}</h2>
          <RichText
            field={{
              value:
                typeof itemFields.responsibilities?.value === 'string'
                  ? itemFields.responsibilities?.value
                  : '',
            }}
          />
        </div>
        {itemFields.isc2MembershipRequired?.value && (
          <div className="pb-4">
            <h2>{TITLES.MEMBERSHIP_REQUIRED}</h2>
            <RichText
              field={{
                value: itemFields.isc2MembershipRequired?.value ? '<p>Yes</p>' : '<p>No</p>',
              }}
            />
          </div>
        )}
        <div className="pb-4">
          <h2>{TITLES.SKILLS_REQUIRED}</h2>
          <RichText
            field={{
              value:
                typeof itemFields.skillsRequired?.value === 'string'
                  ? itemFields.skillsRequired?.value
                  : '',
            }}
          />
        </div>
        <div className="pb-4">
          <h2>{TITLES.TIME_REQUIRED}</h2>
          <RichText
            field={{
              value:
                typeof itemFields.timeRequired?.value === 'string'
                  ? itemFields.timeRequired?.value
                  : '',
            }}
          />
        </div>
        <div className="pb-4">
          <h2>{TITLES.START_END_DATE}</h2>
          <p>
            {TITLES.START_DATE}
            {typeof itemFields.startDate?.value === 'string'
              ? new Date(itemFields.startDate.value).toLocaleDateString()
              : ''}
          </p>
          <p>
            {TITLES.END_DATE}
            {typeof itemFields.endDate?.value === 'string'
              ? new Date(itemFields.endDate.value).toLocaleDateString()
              : ''}
          </p>
        </div>
        <div className="pb-4">
          <h2>{TITLES.CONTACT}</h2>
          <RichText
            field={{
              value: typeof itemFields.contact?.value === 'string' ? itemFields.contact?.value : '',
            }}
          />
        </div>
        <div className="pb-4">
          <h2>{TITLES.CPE_CREDITS}</h2>
          <RichText
            field={{
              value:
                typeof itemFields.cpeCredits?.value === 'string'
                  ? itemFields.cpeCredits?.value
                  : '',
            }}
          />
        </div>
        <div className="pb-4">
          <h2>{TITLES.CPE_SUBMISSION_PROCESS}</h2>
          <RichText
            field={{
              value:
                typeof itemFields.cpeSubmissionProcess?.value === 'string'
                  ? itemFields.cpeSubmissionProcess?.value
                  : '',
            }}
          />
        </div>
        <div className="pb-4">
          <h2>{TITLES.BENEFITS}</h2>
          <RichText
            field={{
              value:
                typeof itemFields.benefits?.value === 'string' ? itemFields.benefits?.value : '',
            }}
          />
        </div>
        <div className="pb-4">{renderSignUpCTA()}</div>
      </div>
    </div>
  );
}

export default OpportunityDetail;
