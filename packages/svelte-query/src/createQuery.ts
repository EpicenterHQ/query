import { isErr } from '@epicenterhq/result'
import { QueryObserver, skipToken } from '@tanstack/query-core'
import { createBaseQuery } from './createBaseQuery.svelte.js'
import type { Result } from '@epicenterhq/result'
import type {
  DefaultError,
  MaybePromise,
  QueryClient,
  QueryFunction,
  QueryKey,
  SkipToken,
} from '@tanstack/query-core'
import type {
  Accessor,
  CreateQueryOptions,
  CreateQueryResult,
  DefinedCreateQueryResult,
} from './types.js'
import type {
  DefinedInitialDataOptions,
  UndefinedInitialDataOptions,
} from './queryOptions.js'

export function createQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: Accessor<
    UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>
  >,
  queryClient?: Accessor<QueryClient>,
): CreateQueryResult<TData, TError>

export function createQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: Accessor<
    DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>
  >,
  queryClient?: Accessor<QueryClient>,
): DefinedCreateQueryResult<TData, TError>

export function createQuery<
  TQueryFnData,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: Accessor<CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey>>,
  queryClient?: Accessor<QueryClient>,
): CreateQueryResult<TData, TError>

export function createQuery(
  options: Accessor<CreateQueryOptions>,
  queryClient?: Accessor<QueryClient>,
) {
  return createBaseQuery(options, QueryObserver, queryClient)
}

export function createResultQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: Accessor<
    Omit<
      CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
      'queryFn'
    > & {
      queryFn?:
        | QueryFunction<Result<TQueryFnData, TError>, TQueryKey>
        | SkipToken
    }
  >,
) {
  return createQuery<TQueryFnData, TError, TData, TQueryKey>(() => {
    const { queryFn, ...optionValues } = options()
    if (queryFn === undefined || queryFn === skipToken) {
      return { ...optionValues, queryFn }
    }
    return {
      ...optionValues,
      queryFn: async (...args) => {
        const result = await queryFn(...args)
        if (isErr(result)) throw result.error
        return result.data
      },
    }
  })
}
