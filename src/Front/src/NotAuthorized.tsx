import Head from 'next/head';

/**
 * Rendered in case if we have not authorized error
 */
const NotAuthorized = (): JSX.Element => (
  <>
    <Head>
      <title>401: Not Authorized</title>
    </Head>
    <div style={{ padding: 10 }}>
      <h1>You are not authorized to view this page</h1>
    </div>
  </>
);

export default NotAuthorized;
