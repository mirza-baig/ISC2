/**
 * Re-establish the global JSX namespace that @types/react@19 removed.
 * React 19 moved JSX typings from the global `JSX` namespace to `React.JSX`.
 * Existing components that use bare `JSX.Element` return types rely on this global.
 * Remove this file when all components have been migrated to use React.JSX.Element or React.ReactNode.
 */
import type React from 'react';

declare global {
  namespace JSX {
    interface Element extends React.JSX.Element {}
    interface ElementClass extends React.JSX.ElementClass {}
    interface ElementAttributesProperty extends React.JSX.ElementAttributesProperty {}
    interface ElementChildrenAttribute extends React.JSX.ElementChildrenAttribute {}
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    type LibraryManagedAttributes<C, P> = React.JSX.LibraryManagedAttributes<C, P>;
    interface IntrinsicAttributes extends React.JSX.IntrinsicAttributes {}
    interface IntrinsicClassAttributes<T> extends React.JSX.IntrinsicClassAttributes<T> {}
    interface IntrinsicElements extends React.JSX.IntrinsicElements {}
  }
}
