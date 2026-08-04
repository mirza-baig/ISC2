import { signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

import { useLoggedUser } from 'hooks/index';

export default function ProtectedPage() {
  const router = useRouter();

  const { isUserLoggedIn, isUserNotLoggedIn } = useLoggedUser();

  useEffect(() => {
    if (isUserLoggedIn) {
      router.replace('/');
    }

    if (isUserNotLoggedIn) {
      const { href } = window.location;
      const callbackUrl = new URL(href).searchParams.get('callbackUrl') || undefined;

      signIn('salesforce', { callbackUrl });
    }
  }, [isUserNotLoggedIn, isUserLoggedIn, router]);

  return null;
}
