/**
 * @jest-environment node
 *
 * TEMPORARY PROBE - not part of the suite. Proves what RichTextUI emits during
 * server rendering, which is exactly what the Algolia crawler and Googlebot's
 * first pass see.
 */
import { renderToString } from 'react-dom/server';

import RichTextUI from '../RichTextUI';

const ARTICLE_HTML =
  '<h2>Zero Trust in Practice</h2><p>Zero trust assumes breach and verifies explicitly.</p>';

const EMBED_HTML =
  '<div id="bt-player"></div><script src="https://www.brighttalk.com/clients/js/embed/embed.js"></script>';

describe('RichTextUI server rendering', () => {
  it('emits article prose into the SSR HTML', () => {
    const html = renderToString(<RichTextUI value={ARTICLE_HTML} />);

    console.log('\n=== SSR OUTPUT (article) ===\n' + html + '\n=== END ===\n');

    expect(html).toContain('Zero trust assumes breach');
  });

  it('emits the embed container into the SSR HTML', () => {
    const html = renderToString(<RichTextUI value={EMBED_HTML} />);

    console.log('\n=== SSR OUTPUT (embed) ===\n' + html + '\n=== END ===\n');

    expect(html).toContain('bt-player');
  });
});
