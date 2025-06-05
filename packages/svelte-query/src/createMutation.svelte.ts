import { onDestroy } from 'svelte'
import { isErr } from '@epicenterhq/result'

import { MutationObserver, notifyManager } from '@tanstack/query-core'
import { useQueryClient } from './useQueryClient.js'
import type {
  Accessor,
  CreateMutateFunction,
  CreateMutationOptions,
  CreateMutationResult,
} from './types.js'
import type { Result } from '@epicenterhq/result'

import type {
  DefaultError,
  MutationFunction,
  QueryClient,
} from '@tanstack/query-core'

/**
 * @param options - A function that returns mutation options
 * @param queryClient - Custom query client which overrides provider
 */
export function createMutation<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TContext = unknown,
>(
  options: Accessor<CreateMutationOptions<TData, TError, TVariables, TContext>>,
  queryClient?: Accessor<QueryClient>,
): CreateMutationResult<TData, TError, TVariables, TContext> {
  const client = useQueryClient(queryClient?.())

  const observer = $derived(
    new MutationObserver<TData, TError, TVariables, TContext>(
      client,
      options(),
    ),
  )

  const mutate = $state<
    CreateMutateFunction<TData, TError, TVariables, TContext>
  >((variables, mutateOptions) => {
    observer.mutate(variables, mutateOptions).catch(noop)
  })

  $effect.pre(() => {
    observer.setOptions(options())
  })

  const result = $state(observer.getCurrentResult())

  const unsubscribe = observer.subscribe((val) => {
    notifyManager.batchCalls(() => {
      Object.assign(result, val)
    })()
  })

  onDestroy(() => {
    unsubscribe()
  })

  // @ts-expect-error
  return new Proxy(result, {
    get: (_, prop) => {
      const r = {
        ...result,
        mutate,
        mutateAsync: result.mutate,
      }
      if (prop == 'value') return r
      // @ts-expect-error
      return r[prop]
    },
  })
}

function noop() {}

export function createResultMutation<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TContext = unknown,
>(
  options: Accessor<
    Omit<
      CreateMutationOptions<TData, TError, TVariables, TContext>,
      'mutationFn'
    > & {
      mutationFn?: MutationFunction<Result<TData, TError>, TVariables>
    }
  >,
  queryClient?: Accessor<QueryClient>,
): CreateMutationResult<TData, TError, TVariables, TContext> {
  return createMutation<TData, TError, TVariables, TContext>(() => {
    const { mutationFn, ...optionValues } = options()
    if (mutationFn === undefined) {
      return { ...optionValues, mutationFn }
    }
    return {
      ...optionValues,
      mutationFn: async (variables: TVariables) => {
        const result = await mutationFn(variables)
        if (isErr(result)) throw result.error
        return result.data
      },
    }
  }, queryClient)
}
