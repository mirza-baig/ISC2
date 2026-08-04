/**
 * @jest-environment jsdom
 *
 * TEMPORARY PROBE - not part of the suite. Guards the MC-2885 behaviour: an embed
 * script inside rich text must actually execute in the browser. innerHTML-inserted
 * <script> tags never run, which is why MC-2885 added injectScripts.
 */
import { MessageChannel as NodeMessageChannel } from 'worker_threads';
import { TextEncoder as NodeTextEncoder, TextDecoder as NodeTextDecoder } from 'util';

import { hydrateRoot } from 'react-dom/client';
import { act } from 'react';

import RichTextUI from '../RichTextUI';

// react-dom/server resolves to its browser build under jsdom, which expects a handful of
// web globals jsdom does not expose. These must be in place before react-dom/server loads,
// hence the require below rather than a hoisted import.
const globals = globalThis as {
  MessageChannel?: unknown;
  TextEncoder?: unknown;
  TextDecoder?: unknown;
};

globals.MessageChannel ??= NodeMessageChannel;
globals.TextEncoder ??= NodeTextEncoder;
globals.TextDecoder ??= NodeTextDecoder;

// Without this act() does not flush concurrent work and React's behaviour here would not
// reflect the browser.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/* eslint-disable @typescript-eslint/no-var-requires */
const { renderToString } = require('react-dom/server') as typeof import('react-dom/server');

declare global {
  interface Window {
    __EMBED_BOOTED__?: number;
  }
}

const EMBED_HTML =
  '<div id="bt-player"></div>' +
  '<script>window.__EMBED_BOOTED__ = (window.__EMBED_BOOTED__ || 0) + 1;</script>';

describe('RichTextUI embed scripts', () => {
  beforeEach(() => {
    window.__EMBED_BOOTED__ = undefined;
    document.body.innerHTML = '';
  });

  // The MC-2885 failure mode: BrightTALK's script builds an iframe React never rendered.
  // If a later re-render makes React rewrite the container, the player is destroyed.
  it('keeps a third-party injected iframe across a re-render with identical content', async () => {
    const host = document.createElement('div');
    host.innerHTML = renderToString(<RichTextUI value={EMBED_HTML} />);
    document.body.appendChild(host);

    let root: ReturnType<typeof hydrateRoot> | undefined;
    await act(async () => {
      root = hydrateRoot(host, <RichTextUI value={EMBED_HTML} />);
    });

    // Stand in for the embed script building its player.
    const iframe = document.createElement('iframe');
    iframe.id = 'bt-player-wrapper-iframe';
    host.querySelector('#bt-player')?.appendChild(iframe);
    expect(host.querySelector('#bt-player-wrapper-iframe')).not.toBeNull();

    await act(async () => {
      root?.render(<RichTextUI value={EMBED_HTML} />);
    });

    console.log('\n=== DOM AFTER RE-RENDER ===\n' + host.innerHTML + '\n=== END ===\n');
    console.log('embed booted count after re-render:', window.__EMBED_BOOTED__);

    expect(host.querySelector('#bt-player-wrapper-iframe')).not.toBeNull();
    expect(window.__EMBED_BOOTED__).toBe(1);
  });

  it('swaps in new content and re-boots its scripts when the value changes', async () => {
    const NEXT_HTML =
      '<div id="bt-player-2"></div>' +
      '<script>window.__EMBED_BOOTED__ = (window.__EMBED_BOOTED__ || 0) + 1;</script>';

    const host = document.createElement('div');
    host.innerHTML = renderToString(<RichTextUI value={EMBED_HTML} />);
    document.body.appendChild(host);

    let root: ReturnType<typeof hydrateRoot> | undefined;
    await act(async () => {
      root = hydrateRoot(host, <RichTextUI value={EMBED_HTML} />);
    });
    expect(window.__EMBED_BOOTED__).toBe(1);

    await act(async () => {
      root?.render(<RichTextUI value={NEXT_HTML} />);
    });

    console.log('\n=== DOM AFTER VALUE CHANGE ===\n' + host.innerHTML + '\n=== END ===\n');

    expect(host.querySelector('#bt-player-2')).not.toBeNull();
    expect(host.querySelector('#bt-player')).toBeNull();
    expect(window.__EMBED_BOOTED__).toBe(2);
  });

  it('boots the embed script after hydration and keeps the markup', async () => {
    const ssr = renderToString(<RichTextUI value={EMBED_HTML} />);

    const host = document.createElement('div');
    host.innerHTML = ssr;
    document.body.appendChild(host);

    // Baseline: pasting SSR markup never runs its scripts. This is the whole reason
    // injectScripts exists.
    expect(window.__EMBED_BOOTED__).toBeUndefined();

    await act(async () => {
      hydrateRoot(host, <RichTextUI value={EMBED_HTML} />);
    });

    console.log('\n=== DOM AFTER HYDRATION ===\n' + host.innerHTML + '\n=== END ===\n');
    console.log('embed booted count:', window.__EMBED_BOOTED__);

    expect(window.__EMBED_BOOTED__).toBe(1);
    expect(host.querySelector('#bt-player')).not.toBeNull();
  });
});
