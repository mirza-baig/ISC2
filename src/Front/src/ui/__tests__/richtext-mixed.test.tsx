/**
 * @jest-environment jsdom
 *
 * TEMPORARY PROBE. The case a per-instance clientOnly flag cannot express: ONE rich text
 * field holding both article prose and an embed. Whichever way the flag is set for that
 * instance, one of the two requirements loses.
 */
import { MessageChannel as NodeMessageChannel } from 'worker_threads';
import { TextEncoder as NodeTextEncoder, TextDecoder as NodeTextDecoder } from 'util';

import { hydrateRoot } from 'react-dom/client';
import { act } from 'react';

import RichTextUI from '../RichTextUI';

const globals = globalThis as {
  MessageChannel?: unknown;
  TextEncoder?: unknown;
  TextDecoder?: unknown;
  IS_REACT_ACT_ENVIRONMENT?: boolean;
};

globals.MessageChannel ??= NodeMessageChannel;
globals.TextEncoder ??= NodeTextEncoder;
globals.TextDecoder ??= NodeTextDecoder;
globals.IS_REACT_ACT_ENVIRONMENT = true;

/* eslint-disable @typescript-eslint/no-var-requires */
const { renderToString } = require('react-dom/server') as typeof import('react-dom/server');

// An Insights article that embeds a webinar: prose the crawler must index, plus an embed
// that must boot and survive.
const MIXED_HTML =
  '<h2>Defending the Cloud</h2>' +
  '<p>Cloud workloads shift the perimeter to identity.</p>' +
  '<div id="bt-player"></div>' +
  '<script>window.__EMBED_BOOTED__ = (window.__EMBED_BOOTED__ || 0) + 1;</script>' +
  '<p>Register for the full session above.</p>';

describe('rich text holding BOTH prose and an embed', () => {
  it('indexes the prose AND keeps the embed alive', async () => {
    const ssr = renderToString(<RichTextUI value={MIXED_HTML} />);

    console.log('\n=== SSR (mixed) ===\n' + ssr + '\n=== END ===\n');

    // Requirement 1: the crawler must see the prose.
    expect(ssr).toContain('Cloud workloads shift the perimeter');

    const host = document.createElement('div');
    host.innerHTML = ssr;
    document.body.appendChild(host);

    let root: ReturnType<typeof hydrateRoot> | undefined;
    await act(async () => {
      root = hydrateRoot(host, <RichTextUI value={MIXED_HTML} />);
    });

    // Requirement 2: the embed must boot.
    expect((window as { __EMBED_BOOTED__?: number }).__EMBED_BOOTED__).toBe(1);

    const iframe = document.createElement('iframe');
    iframe.id = 'bt-player-wrapper-iframe';
    host.querySelector('#bt-player')?.appendChild(iframe);

    await act(async () => {
      root?.render(<RichTextUI value={MIXED_HTML} />);
    });

    // Requirement 3: a re-render must not destroy the player.
    expect(host.querySelector('#bt-player-wrapper-iframe')).not.toBeNull();
    expect(host.textContent).toContain('Cloud workloads shift the perimeter');
  });
});
