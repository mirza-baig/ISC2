import { ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { useIdleTimeout } from 'hooks/useIdleTimeout';

interface IdleTimeoutProviderProps {
  children: ReactNode;
}

export function IdleTimeoutProvider({ children }: IdleTimeoutProviderProps): JSX.Element {
  const { status } = useSession();
  const isAuthenticated = status === 'authenticated';

  useIdleTimeout({ isAuthenticated });

  return <>{children}</>;
}

export default IdleTimeoutProvider;
