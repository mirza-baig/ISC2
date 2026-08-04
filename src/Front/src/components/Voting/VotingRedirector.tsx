import React, { useState, useEffect, useRef } from 'react';
import { signIn } from 'next-auth/react';

import { useLoggedUser } from 'hooks/index';
import LoadingIndicator from 'ui/LoadingIndicator';

const NOT_AUTH_PATH = '/unauthorized-access';

interface VotingTokenResponse {
  token: string;
  redirectUrl: string;
  memberNumber: string;
}

const VotingRedirector = () => {
  const { isUserLoggedIn, isUserNotLoggedIn, isUserMember, sessionStatus } = useLoggedUser();
  const [error, setError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [initialDelayComplete, setInitialDelayComplete] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const delayTimer = setTimeout(() => {
      setInitialDelayComplete(true);
    }, 3000);

    return () => {
      clearTimeout(delayTimer);
    };
  }, []);

  const handleVotingSubmission = async (votingKey: string) => {
    try {
      setIsRedirecting(true);

      const response = await fetch(`/api/voting/redirect?v=${votingKey}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();

        if (response.status === 401) {
          signIn('salesforce');
          return;
        }

        if (response.status === 403) {
          const fullRedirectUrl = new URL(
            NOT_AUTH_PATH,
            process.env.NEXT_PUBLIC_REAL_PUBLIC_URL || window.location.origin
          );
          window.location.href = fullRedirectUrl.toString();
          return;
        }

        throw new Error(errorData.error || 'Failed to get voting token');
      }

      const data: VotingTokenResponse = await response.json();

      const form = document.createElement('form');
      form.method = 'POST';
      form.action = data.redirectUrl;
      form.style.display = 'none';

      const tokenInput = document.createElement('input');
      tokenInput.type = 'hidden';
      tokenInput.name = 'token';
      tokenInput.value = data.token;

      const loginInput = document.createElement('input');
      loginInput.type = 'hidden';
      loginInput.name = 'login';
      loginInput.value = data.memberNumber;

      form.appendChild(tokenInput);
      form.appendChild(loginInput);
      document.body.appendChild(form);

      form.submit();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsRedirecting(false);
    }
  };

  useEffect(() => {
    if (!initialDelayComplete) {
      return;
    }

    if (isRedirecting) {
      return;
    }

    if (sessionStatus === 'loading') {
      return;
    }

    if (isUserNotLoggedIn) {
      signIn('salesforce');
      return;
    }

    if (isUserLoggedIn) {
      if (!isUserMember) {
        const fullRedirectUrl = new URL(
          NOT_AUTH_PATH,
          process.env.NEXT_PUBLIC_REAL_PUBLIC_URL || window.location.origin
        );
        window.location.href = fullRedirectUrl.toString();
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const key = params.get('v') as string;

      if (key) {
        handleVotingSubmission(key);
      } else {
        setError('No voting key found. Please check the link and try again.');
      }
    }
  }, [
    initialDelayComplete,
    isUserMember,
    isUserLoggedIn,
    isUserNotLoggedIn,
    sessionStatus,
    isRedirecting,
  ]);

  if (error) {
    return (
      <div className="flex flex-col items-center text-center justify-center w-full md:px-16 md:py-20">
        <h3 className="mt-20 text-black text-xl">{error}</h3>
        <button
          onClick={() => {
            setError(null);
            setIsRedirecting(false);
            window.location.reload();
          }}
          className="mt-4 px-6 py-2 bg-darker-green text-white rounded-lg hover:bg-opacity-90"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center text-center justify-center w-full md:px-16 md:pt-40 md:pb-20">
      <LoadingIndicator />
      <p className="mt-4 text-gray-600">
        {isRedirecting ? 'Redirecting to voting platform...' : 'Preparing your voting session...'}
      </p>
      <form ref={formRef} style={{ display: 'none' }} />
    </div>
  );
};

export default VotingRedirector;
