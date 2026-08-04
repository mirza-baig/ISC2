import {
  MutationFunction,
  MutationKey,
  useIsMutating,
  useMutation,
  UseMutationOptions,
  UseMutationResult,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

type CustomMutationPayload<
  TData = unknown,
  TError = unknown,
  TVariables = unknown,
  TContext = unknown
> = Omit<UseMutationOptions<TData, TError, TVariables, TContext>, 'mutationKey' | 'mutationFn'> & {
  mutationKey: MutationKey;
  mutationFn: MutationFunction<TData, TVariables>;
};

const useCustomMutation = <
  TData = unknown,
  TError = unknown,
  TVariables = unknown,
  TContext = unknown
>({
  mutationFn,
  mutationKey,
  ...options
}: CustomMutationPayload<TData, TError, TVariables, TContext>): UseMutationResult<
  TData,
  TError,
  TVariables,
  TContext
> => {
  const queryClient = useQueryClient();

  const query = useQuery<TData, TError>({
    queryKey: ['CustomMutation', mutationKey],
    queryFn: async () => await Promise.resolve(false as unknown as TData),
    retry: false,
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    refetchIntervalInBackground: false,
    refetchInterval: 0,
  });

  const queryVariables = useQuery<TVariables, TError>({
    queryKey: ['CustomMutationVariables', mutationKey],
    queryFn: async () => await Promise.resolve(false as unknown as TVariables),
    retry: false,
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    refetchIntervalInBackground: false,
    refetchInterval: 0,
  });

  const queryError = useQuery<TError, TData>({
    queryKey: ['CustomMutationError', mutationKey],
    queryFn: async () => await Promise.resolve(false as unknown as TError),
    retry: false,
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    refetchIntervalInBackground: false,
    refetchInterval: 0,
  });

  const querySuccess = useQuery<boolean, TError>({
    queryKey: ['CustomMutationSuccess', mutationKey],
    queryFn: async () => await Promise.resolve(false),
    retry: false,
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    refetchIntervalInBackground: false,
    refetchInterval: 0,
  });

  const mutation = useMutation<TData, TError, TVariables, TContext>({
    mutationKey,
    mutationFn: async (...params) => {
      queryClient.setQueryData(['CustomMutationError', mutationKey], null);
      queryClient.setQueryData(['CustomMutationVariables', mutationKey], params[0]);
      queryClient.setQueryData(['CustomMutationSuccess', mutationKey], false);
      return await mutationFn(...params);
    },
    ...options,
    retry: false,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.setQueryData(['CustomMutation', mutationKey], data);
      queryClient.setQueryData(['CustomMutationSuccess', mutationKey], true);
      if (options?.onSuccess) options.onSuccess(data, variables, onMutateResult, context);
    },
    onError: (err, variables, onMutateResult, context) => {
      queryClient.setQueryData(['CustomMutationError', mutationKey], err);
      queryClient.setQueryData(['CustomMutationSuccess', mutationKey], false);
      if (options?.onError) options.onError(err, variables, onMutateResult, context);
    },
  });

  const isLoading = useIsMutating({ mutationKey });

  const reset = () => {
    queryClient.setQueryData(['CustomMutation', mutationKey], null);
    queryClient.setQueryData(['CustomMutationVariables', mutationKey], null);
    queryClient.setQueryData(['CustomMutationError', mutationKey], null);
    mutation.reset();
  };

  // We need typecasting here due the ADT about the mutation result, and as we're using a data not related to the mutation result
  // The typescript can't infer the type correctly.
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return {
    ...mutation,
    data: query.data,
    isPending: !!isLoading,
    error: queryError.data,
    isError: !!queryError.data,
    isSuccess: querySuccess.data,
    variables: queryVariables.data,
    reset,
  } as UseMutationResult<TData, TError, TVariables, TContext>;
};

export default useCustomMutation;
