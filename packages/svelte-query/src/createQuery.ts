import { isErr } from '@epicenterhq/result';
import { QueryObserver, skipToken } from '@tanstack/query-core';
import { createBaseQuery } from './createBaseQuery.svelte.js';
import type {
  DefaultError,
  QueryClient,
  QueryFunction,
  QueryKey,
  SkipToken,
} from '@tanstack/query-core';
import type { ExtractErrFromResult, ExtractOkFromResult, Result } from '@epicenterhq/result';
import type {
  DefinedInitialDataOptions,
  UndefinedInitialDataOptions,
} from './queryOptions.js';
import type {
  Accessor,
  CreateQueryOptions,
  CreateQueryResult,
  DefinedCreateQueryResult,
} from './types.js';

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
  TResult extends Result<unknown, unknown> = Result<unknown, DefaultError>,
  TData = ExtractOkFromResult<TResult>,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: Accessor<
    Omit<
      CreateQueryOptions<ExtractOkFromResult<TResult>, ExtractErrFromResult<TResult>, TData, TQueryKey>,
      'queryFn'
    > & {
      queryFn?:
        | QueryFunction<TResult, TQueryKey>
        | SkipToken
    }
  >,
  queryClient?: Accessor<QueryClient>,
) {
  return createQuery<ExtractOkFromResult<TResult>, ExtractErrFromResult<TResult>, TData, TQueryKey>(() => {
    const { queryFn, ...optionValues } = options()
    if (queryFn === undefined || queryFn === skipToken) {
      return { ...optionValues, queryFn }
    }
    return {
      ...optionValues,
      queryFn: async (...args) => {
        const result = await queryFn(...args)
        if (isErr(result)) throw result.error as ExtractErrFromResult<TResult>
        return result.data as ExtractOkFromResult<TResult>
      },
    }
  }, queryClient)
}
