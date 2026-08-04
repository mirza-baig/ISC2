# Feature Flags Developer Guide

<!-- markdownlint-disable-file MD043 -->

A short guide to putting a feature behind a flag, plus where flags are the
right tool and where they aren't.

## How it works (the short version)

Flag values live in one Sitecore content item:

```text
/sitecore/content/ISC2/Main/Data/Feature Flags Folder/Feature Flags
```

Its **Flags** field is a two-column list: the flag name on the left, and an
Enabled/Disabled dropdown on the right.

On every page render, a page-props plugin
(`src/lib/page-props-factory/plugins/feature-flags.ts`) reads that field,
turns it into a `{ name: boolean }` map, and hands it to the app through a
React context. You read it with a hook. That is the whole loop; there is
nothing to fetch or wire up yourself.

## Adding a flag to something

There are only two real steps, and neither needs changes to the plugin.

**1. Gate your code with the hook.**

```tsx
import { useFeatureFlag } from 'providers/featureFlags';

const Checkout = (props) => {
  const useNewCheckout = useFeatureFlag('New_Checkout');
  return useNewCheckout ? (
    <NewCheckout {...props} />
  ) : (
    <LegacyCheckout {...props} />
  );
};
```

For a whole component that should simply not exist when off, return `null`
(this is what `TestFeatureComponent.tsx` does):

```tsx
const Promo = (props) => {
  if (!useFeatureFlag('Holiday_Promo')) return null;
  return <PromoBanner {...props} />;
};
```

The hook returns a boolean and is just a context read, so use it freely.
Anything not explicitly Enabled comes back `false`.

**2. Add the flag in Sitecore.**

Open the Feature Flags item above, add a row to the **Flags** field with your
name on the left, set Enabled/Disabled on the right, then save and publish.

Pick the name first and use the exact same string in both places; it is the
contract between the code and Sitecore. Keep names descriptive and stable
(for example `New_Checkout`). Once you have picked one, do not rename it
without updating both sides.

## Things to know before you rely on it

- **Off by default.** A flag that does not exist, is misspelled, or is set to
  Disabled reads as `false`. A half-finished feature will not leak out just
  because someone forgot the row, but it also means the row has to be there
  and Enabled for the feature to show.
- **The values are per environment and are not deployed.** The template,
  options, and your code ship with the release; the values in that data item
  are set by hand in each environment and are intentionally not serialized.
  So "turn it on in prod" is a manual, per-environment step. Plan for it.
- **It resolves in the page pipeline.** The flag map is built server-side
  during page-props and works for both SSR and client render. It is not
  available in middleware, `next.config.js`, build scripts, or anywhere
  outside the normal page render.
- **Changes take a publish and cache cycle.** Flipping a flag means editing
  the item and publishing; it is not instant.

## What flags are good for

- Turning a UI feature or component on and off without a code deploy.
- Per-environment release gating: merge code early with the flag off, enable
  it in QA or UAT for testing, and leave it off in prod until launch day.
- Swapping between an old and new implementation while you migrate.
- Toggles you want a non-developer (PM or content) to own, since it is just a
  content edit.

## What flags are not good for

- **A true emergency kill switch.** Turning something off depends on a
  publish and cache invalidation, so it is not instantaneous. If a feature
  needs an instant, reliable off-switch, use environment config or an
  edge-level setting instead.
- **Security or hiding sensitive data.** This gates rendering, not access. A
  self-gated component returns `null`, but its datasource can still be
  fetched, and anything the client needs still ships to the client. Never use
  a flag to protect data or an endpoint; do that on the server or API.
- **Per-user, A/B, or percentage rollouts.** It is a single global on/off per
  environment, not targeting. For audience or variant logic use Sitecore
  Personalize.
- **Backend or API behavior.** It only affects the front-end render. If an API
  needs to change behavior, gate it there.
- **Build-time or middleware decisions.** The value does not exist that early
  or in those contexts.
- **A general app config store.** It is boolean on/off, not a place for
  settings, strings, or numbers.

## Where the pieces live

Paths below are relative to `src/Front`.

- Hook and context: `src/providers/featureFlags.tsx`
- Plugin that loads the values:
  `src/lib/page-props-factory/plugins/feature-flags.ts`
- Provider mounted in: `src/pages/_app.tsx`
- Example usage:
  `src/components/TestFeatureComponent/TestFeatureComponent.tsx`
