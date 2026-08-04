import { useEffect } from 'react';
import Head from 'next/head';
import {
  GraphQLErrorPagesService,
  SitecoreContext,
  ErrorPages,
  ComponentPropsContext,
} from '@sitecore-jss/sitecore-jss-nextjs';
import { handleEditorFastRefresh } from '@sitecore-jss/sitecore-jss-nextjs/utils';
import { SitecorePageProps } from 'lib/page-props';
import Layout from 'src/Layout';
import { componentBuilder } from 'temp/componentBuilder';
import { GetStaticProps } from 'next';
import config from 'temp/config';
import { siteResolver } from 'lib/site-resolver';
import clientFactory from 'lib/graphql-client-factory';
import { HeaderNavigationProvider, SearchProvider } from 'src/providers';
import { useAnalyticsTracking } from 'hooks/index';
import { sitecorePagePropsFactory } from 'lib/page-props-factory';
import { ANALYTICS_EVENTS } from 'constants/index';

/**
 * Rendered in case if we have 500 error
 */
const ServerError = () => (
  <>
    <Head>
      <title>500: Server Error</title>
    </Head>
    <div style={{ padding: 10 }}>
      <h1>500 Internal Server Error</h1>
      <p>There is a problem with the resource you are looking for, and it cannot be displayed.</p>
      <a href="/">Go to the Home page</a>
    </div>
  </>
);

const Custom500 = (props: SitecorePageProps) => {
  const { track } = useAnalyticsTracking();

  useEffect(() => {
    track({
      event: ANALYTICS_EVENTS['500_ERROR'],
    });

    // Since Sitecore editors do not support Fast Refresh, need to refresh editor chromes after Fast Refresh finished
    handleEditorFastRefresh();
  }, [track]);

  if (!(props && props.layoutData)) {
    return <ServerError />;
  }

  return (
    <ComponentPropsContext value={props.componentProps}>
      <SitecoreContext
        componentFactory={componentBuilder.getComponentFactory()}
        layoutData={props.layoutData}
      >
        <HeaderNavigationProvider>
          <SearchProvider>
            <Layout layoutData={props.layoutData} headLinks={props.headLinks} />
          </SearchProvider>
        </HeaderNavigationProvider>
      </SitecoreContext>
    </ComponentPropsContext>
  );
};

export const getStaticProps: GetStaticProps = async (context) => {
  const site = siteResolver.getByName(config.sitecoreSiteName);
  const errorPagesService = new GraphQLErrorPagesService({
    clientFactory,
    siteName: site.name,
    language: context.locale || context.defaultLocale || config.defaultLanguage,
    retries:
      (process.env.GRAPH_QL_SERVICE_RETRIES &&
        parseInt(process.env.GRAPH_QL_SERVICE_RETRIES, 10)) ||
      0,
  });

  let resultErrorPages: ErrorPages | null = null;
  let sitecoreProps = null;

  if (!process.env.DISABLE_SSG_FETCH) {
    try {
      resultErrorPages = await errorPagesService.fetchErrorPages();
    } catch (error) {
      console.log('Error occurred while fetching error pages');
      console.log(error);
    }
  }

  const paths = [
    ...(resultErrorPages?.notFoundPagePath?.split('/')?.filter((x) => x.length > 0) ?? [
      '/ServerError',
    ]),
  ];

  context.params = {
    path: paths,
  };

  if (!process.env.DISABLE_SSG_FETCH) {
    try {
      sitecoreProps = await sitecorePagePropsFactory.create(context);
    } catch (error) {
      console.log('Error occurred while fetching sitecore props');
      console.log(error);
    }
  }

  return {
    props: {
      componentProps: sitecoreProps?.componentProps || null,
      headLinks: [],
      layoutData: resultErrorPages?.serverErrorPage?.rendered || null,
    },
  };
};

export default Custom500;
