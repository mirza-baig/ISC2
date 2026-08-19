/* eslint-disable @next/next/next-script-for-ga, @next/next/no-sync-scripts */
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

import {
  buildOptanonWrapperScript,
  GOOGLE_CONSENT_MODE_SCRIPT,
  ONETRUST_SDK_STUB_SRC,
} from 'src/consentScripts';

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;
const ONETRUST_ID = process.env.NEXT_PUBLIC_ONETRUST_ENVIRONMENT;
const pageNotFoundUrl = `${process.env.NEXT_PUBLIC_PAGE_NOT_FOUND_URL}`;
/**
 * Rendered in case if we have 404 error
 */
const NotFound = (): JSX.Element => {
  const router = useRouter();
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (window.location.pathname.toLowerCase() != pageNotFoundUrl.toLowerCase()) {
        router.replace(pageNotFoundUrl);
      }
    }
  });
  return (
    <>
      <Head>
        {GTM_ID && (
          <script
            id="google_consent_mode"
            dangerouslySetInnerHTML={{ __html: GOOGLE_CONSENT_MODE_SCRIPT }}
          />
        )}

        {ONETRUST_ID && (
          <>
            <script
              src={ONETRUST_SDK_STUB_SRC}
              type="text/javascript"
              charSet="UTF-8"
              data-domain-script={ONETRUST_ID}
            />
            <script
              id="onetrust_optanon"
              dangerouslySetInnerHTML={{ __html: buildOptanonWrapperScript(GTM_ID) }}
            />
          </>
        )}

        <title>404: NotFound</title>
      </Head>
    </>
  );
};
export default NotFound;
