import { useEffect } from 'react';
import { GetStaticPaths, GetStaticProps } from 'next';
import NotFound from 'src/NotFound';
import Layout from 'src/Layout';
import {
  SitecoreContext,
  ComponentPropsContext,
  StaticPath,
} from '@sitecore-jss/sitecore-jss-nextjs';
import { handleEditorFastRefresh } from '@sitecore-jss/sitecore-jss-nextjs/utils';
import { SitecorePageProps } from 'lib/page-props';
import { sitecorePagePropsFactory } from 'lib/page-props-factory';
import { componentBuilder } from 'temp/componentBuilder';
import { sitemapFetcher } from 'lib/sitemap-fetcher';
import { usePersonalize, useModal, CartProvider } from 'src/providers';
import { useRouter } from 'next/router';

const SitecorePage = ({ notFound, componentProps, layoutData, headLinks }: SitecorePageProps) => {
  const { pageView } = usePersonalize();
  const { closeModal } = useModal();
  const router = useRouter();

  useEffect(() => {
    if (layoutData.sitecore.route?.displayName) {
      pageView();
    }
  }, [pageView, layoutData.sitecore.route?.displayName]);

  useEffect(() => {
    router.events.on('routeChangeStart', closeModal);

    return () => {
      router.events.off('routeChangeStart', closeModal);
    };
  }, [closeModal, router.events]);

  useEffect(() => {
    // Since Sitecore editors do not support Fast Refresh, need to refresh editor chromes after Fast Refresh finished
    handleEditorFastRefresh();
  }, []);

  if (notFound || !layoutData.sitecore.route) {
    // Shouldn't hit this (as long as 'notFound' is being returned below), but just to be safe
    return <NotFound />;
  }

  const isEditing = layoutData.sitecore.context.pageEditing;

  return (
    <ComponentPropsContext value={componentProps}>
      <SitecoreContext
        componentFactory={componentBuilder.getComponentFactory({ isEditing })}
        layoutData={layoutData}
      >
        {/* This enables the B2C cart to be used by default */}
        <CartProvider id={undefined}>
          <Layout layoutData={layoutData} headLinks={headLinks} />
        </CartProvider>
      </SitecoreContext>
    </ComponentPropsContext>
  );
};

// This function gets called at build and export time to determine
// pages for SSG ("paths", as tokenized array).
export const getStaticPaths: GetStaticPaths = async (context) => {
  // Fallback, along with revalidate in getStaticProps (below),
  // enables Incremental Static Regeneration. This allows us to
  // leave certain (or all) paths empty if desired and static pages
  // will be generated on request (development mode in this example).
  // Alternatively, the entire sitemap could be pre-rendered
  // ahead of time (non-development mode in this example).
  // See https://nextjs.org/docs/basic-features/data-fetching/incremental-static-regeneration

  let paths: StaticPath[] = [];
  let fallback: boolean | 'blocking' = 'blocking';

  if (process.env.NODE_ENV !== 'development' && !process.env.DISABLE_SSG_FETCH) {
    try {
      // Note: Next.js runs export in production mode
      paths = await sitemapFetcher.fetch(context);
    } catch (error) {
      console.log('Error occurred while fetching static paths');
      console.log(error);
    }

    fallback = process.env.EXPORT_MODE ? false : fallback;
  }

  return {
    paths,
    fallback,
  };
};

// This function gets called at build time on server-side.
// It may be called again, on a serverless function, if
// revalidation (or fallback) is enabled and a new request comes in.
export const getStaticProps: GetStaticProps = async (context) => {
  const props = await sitecorePagePropsFactory.create(context);

  const isPreviewDeploy = process.env.APPLICATION_ENV?.trim() === 'preview';
  const isrInterval = parseInt(process.env.ISR_REVALIDATE_SECONDS ?? '300', 10);

  return {
    props,
    // Next.js will attempt to re-generate the page:
    // - When a request comes in
    // - At most once every revalidate seconds
    // Shorter window in preview so layout/media (e.g. rewritten URLs) is less stale without extra refreshes.
    revalidate: isPreviewDeploy ? 1 : isrInterval,
    notFound: props.notFound, // Returns custom 404 page with a status code of 404 when true
  };
};

export default SitecorePage;
