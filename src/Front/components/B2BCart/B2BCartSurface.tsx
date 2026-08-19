import { B2BPrivateClassProvider } from '../Search/B2BPrivateClassContext';
// Private classes held back on these two surfaces (B-15) — nothing here can open the picker:
// import B2BClassroomLocationModal from '../Search/B2BClassroomLocationModal';

import B2BCartConnected, { type B2BCartConnectedProps } from './B2BCartConnected';

export type B2BCartSurfaceProps = B2BCartConnectedProps;

const B2BCartSurface = (props: B2BCartSurfaceProps): JSX.Element => (
  <B2BPrivateClassProvider>
    <B2BCartConnected {...props} />
    {/* Private classes held back (B-15): <B2BClassroomLocationModal /> */}
  </B2BPrivateClassProvider>
);

export default B2BCartSurface;
