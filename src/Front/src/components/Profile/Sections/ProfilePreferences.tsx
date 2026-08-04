import { useEffect, useCallback, useState, useMemo } from 'react';
import { useLayout } from 'providers/index';
import { SwitchCheckbox, LoadingIndicator } from 'ui/index';
import { useForm } from 'react-hook-form';
import {
  useUpdateCommunicationPreferences,
  useGetAccountData,
  useUpdateUserData,
} from 'hooks/index';
import { Field } from '@sitecore-jss/sitecore-jss-nextjs';
import { validateLanguagePreference, ALLOWED_LANGUAGES } from 'types/languagePreference';

interface ComponentProps {
  rendering?: {
    componentName: string;
    dataSource?: string;
    uid?: string;
  };
  params?: Record<string, string>;
}

interface CommunicationPreferences {
  certificationResources: boolean;
  continuingEducation: boolean;
  memberOffers: boolean;
  newsAndResources: boolean;
  centerForCyber: boolean;
}

interface AccountData {
  communicationPreferences: CommunicationPreferences;
}

interface PreferenceSectionItem {
  id: string;
  url: string;
  name: string;
  displayName: string;
  fields: {
    salesforce_id: {
      value: string;
    };
    label: {
      value: string;
    };
    description: {
      value: string;
    };
  };
}

export interface PreferenceSection {
  id: string;
  url: string;
  name: string;
  displayName: string;
  fields: {
    sectionFooter: {
      value: string;
    };
    sectionItems: PreferenceSectionItem[];
    sectionHeading: {
      value: string;
    };
    sectionSubHeading: {
      value: string;
    };
    sectionDescription: {
      value: string;
    };
  };
}

export type ProfilePreferencesProps = ComponentProps & {
  fields: {
    sections: PreferenceSection[];
    sectionTitle: Field<string>;
    alertLabels: {
      value: string;
    };
    mfaCtaText?: {
      value: string;
    };
    mfaTitle?: {
      value: string;
    };
    mfaDescription?: {
      value: string;
    };
    languageTitle?: {
      value: string;
    };
    languageDescription?: {
      value: string;
    };
    languageOptions?: {
      value: string;
    };
  };
};

export default function ProfilePreferences(props: ProfilePreferencesProps) {
  const { addFlashAlert } = useLayout();
  const [isLoading, setIsLoading] = useState(true);
  const { updateCommunicationPreferences } = useUpdateCommunicationPreferences();
  const { updateUser, isUpdatingUser } = useUpdateUserData();
  const [accountData, setAccountData] = useState<AccountData | null>(null);
  const { data: accountDataFromHook, isLoading: isAccountDataLoading } = useGetAccountData();
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');

  const { control, setValue, watch } = useForm<CommunicationPreferences>({
    defaultValues: {
      certificationResources: false,
      continuingEducation: false,
      memberOffers: false,
      newsAndResources: false,
      centerForCyber: false,
    },
  });

  const openMfaWindow = useCallback(() => {
    const width = 800;
    const height = 600;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;

    const features = [
      'popup',
      `width=${width}`,
      `height=${height}`,
      `left=${left}`,
      `top=${top}`,
      'menubar=no',
      'toolbar=no',
      'location=no',
      'status=no',
      'resizable=no',
      'titlebar=yes',
      'minimizable=no',
      'maximizable=no',
    ].join(',');

    const win = window.open(
      `${process.env.NEXT_PUBLIC_SALESFORCE_AUTHURL}/s/updatemfa`,
      'mfaWindow',
      features
    );

    if (!win) {
      addFlashAlert({
        type: 'error',
        label: 'Popup was blocked by the browser. Please allow popups for this site.',
        closable: true,
      });
      return;
    }

    win.addEventListener('resize', () => {
      win.resizeTo(width, height);
    });
  }, [addFlashAlert]);

  const alertLabels = useMemo(() => {
    const labelsString = props.fields.alertLabels.value;
    const labels: Record<string, string> = {};

    labelsString.split('&').forEach((pair) => {
      const [key, value] = pair.split('=');
      labels[key] = decodeURIComponent(value);
    });

    return labels;
  }, [props.fields.alertLabels.value]);

  const handleLanguageChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const newLanguage = event.target.value;
      setSelectedLanguage(newLanguage);
    },
    [setSelectedLanguage]
  );

  const handleSaveLanguage = useCallback(() => {
    const validation = validateLanguagePreference(selectedLanguage);

    if (!validation.isValid) {
      addFlashAlert({
        type: 'error',
        label: validation.error || 'Invalid language selection',
        closable: true,
      });
      return;
    }

    updateUser(
      { PreferredLanguage: selectedLanguage },
      {
        onSuccess: () => {
          addFlashAlert({
            type: 'success',
            label: alertLabels.updateSuccess,
            closable: true,
          });
        },
        onError: () => {
          addFlashAlert({
            type: 'error',
            label: alertLabels.updateError,
            closable: true,
          });
        },
      }
    );
  }, [selectedLanguage, updateUser, addFlashAlert, alertLabels]);

  const handlePreferenceChange = useCallback(
    async (name: keyof CommunicationPreferences, value: boolean) => {
      setValue(name, value);
      const updatedPreferences = { ...watch(), [name]: value };
      updateCommunicationPreferences(updatedPreferences, {
        onSuccess: () => {
          addFlashAlert({
            type: 'success',
            label: alertLabels.updateSuccess,
            closable: true,
          });
        },
        onError: () => {
          addFlashAlert({
            type: 'error',
            label: alertLabels.updateError,
            closable: true,
          });
        },
      });
    },
    [setValue, watch, updateCommunicationPreferences, addFlashAlert, alertLabels]
  );

  useEffect(() => {
    if (accountDataFromHook?.data?.salesforceGetAccountData?.communicationPreferences) {
      setAccountData({
        communicationPreferences:
          accountDataFromHook.data.salesforceGetAccountData.communicationPreferences,
      });
      setIsLoading(false);
    }
  }, [accountDataFromHook]);

  useEffect(() => {
    const preferredLanguage =
      accountDataFromHook?.data?.salesforceGetAccountData?.PreferredLanguage;
    if (preferredLanguage && preferredLanguage.trim() !== '') {
      setSelectedLanguage(preferredLanguage);
    }
  }, [accountDataFromHook]);

  useEffect(() => {
    const subscription = watch((value, { name, type }) => {
      if (name && type === 'change') {
        handlePreferenceChange(
          name as keyof CommunicationPreferences,
          value[name as keyof CommunicationPreferences] as boolean
        );
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, handlePreferenceChange]);

  useEffect(() => {
    if (accountData?.communicationPreferences) {
      Object.entries(accountData.communicationPreferences).forEach(([key, value]) => {
        setValue(key as keyof CommunicationPreferences, value === 'true');
      });
    }
  }, [accountData, setValue]);

  if (isLoading || isAccountDataLoading) {
    return <LoadingIndicator />;
  }

  return (
    <>
      <h2 className="headline-l">{props.fields.sectionTitle.value}</h2>

      <div className="flex flex-col sm:flex-row space-y-5 sm:space-y-0 sm:space-x-8 my-4">
        <section className="w-full sm:w-1/2 rounded-xl flex flex-col border divide-y">
          <div className="p-8 flex flex-col">
            <h3 className="headline-s font-normal">{props.fields.mfaTitle?.value}</h3>
            <div
              className="text-black"
              dangerouslySetInnerHTML={{ __html: props.fields.mfaDescription?.value || '' }}
            />
            {props.fields?.mfaCtaText?.value && (
              <button
                type="button"
                onClick={openMfaWindow}
                className="cta relative flex space-x-2 !text-sm !tracking-normal primary-cta w-fit mt-4"
                aria-label={props.fields.mfaCtaText.value}
              >
                {props.fields.mfaCtaText.value}
              </button>
            )}
          </div>
        </section>

        {props.fields.languageTitle?.value && (
          <section className="w-full sm:w-1/2 rounded-xl flex flex-col border divide-y">
            <div className="p-8 flex flex-col">
              <h3 className="headline-s font-normal">{props.fields.languageTitle.value}</h3>
              <div
                className="text-black"
                dangerouslySetInnerHTML={{ __html: props.fields.languageDescription?.value || '' }}
              />
              <div className="mt-4">
                <select
                  value={selectedLanguage}
                  onChange={handleLanguageChange}
                  disabled={isUpdatingUser}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Select Language</option>
                  {ALLOWED_LANGUAGES.map((language) => (
                    <option key={language} value={language}>
                      {language}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={handleSaveLanguage}
                disabled={isUpdatingUser || !selectedLanguage}
                className="cta relative flex space-x-2 !text-sm !tracking-normal primary-cta w-fit mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Save Language Preference"
              >
                {isUpdatingUser ? 'Saving...' : 'Save'}
              </button>
            </div>
          </section>
        )}
      </div>

      {props.fields.sections.map((section) => (
        <section key={section.id} className="w-full rounded-xl flex flex-col border divide-y my-4">
          <div className="p-8 flex flex-col space-y-2">
            <h3 className="headline-s font-normal">{section.fields.sectionHeading.value}</h3>
            <h4 className="mb-4 text-[#888E76] font-normal text-[20px]">
              {section.fields.sectionSubHeading.value}
            </h4>
            <div
              className="text-black"
              dangerouslySetInnerHTML={{ __html: section.fields.sectionDescription.value }}
            />
          </div>
          {section.fields.sectionItems.map((item) => (
            <div key={item.id} className="p-8 flex flex-col space-y-2">
              <div className="flex flex-col md:flex-row py-5">
                <div className="md:w-2/3">
                  <h4 className="text-lg font-medium text-gray-900">{item.fields.label.value}</h4>
                  <div
                    className="mt-4 preferences-list"
                    dangerouslySetInnerHTML={{ __html: item.fields.description.value }}
                  />
                </div>
                <div className="md:w-1/3 md:text-right mt-4 md:mt-0">
                  <SwitchCheckbox
                    control={control}
                    name={item.fields.salesforce_id.value as keyof CommunicationPreferences}
                    label={item.fields.label.value}
                  />
                </div>
              </div>
            </div>
          ))}
          {section.fields.sectionFooter && (
            <div className="p-8">
              <div
                className="mt-4"
                dangerouslySetInnerHTML={{ __html: section.fields.sectionFooter.value }}
              />
            </div>
          )}
        </section>
      ))}
    </>
  );
}
