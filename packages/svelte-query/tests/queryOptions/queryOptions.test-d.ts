import { describe, expectTypeOf, test } from 'vitest'
import {
  QueriesObserver,
  QueryClient,
  dataTagSymbol,
  skipToken,
} from '@tanstack/query-core'
import { createQueries, queryOptions } from '../../src/index.js'
import type { QueryObserverResult } from '@tanstack/query-core'

describe('queryOptions', () => {
  test('Should not allow excess properties', () => {
    queryOptions({
      queryKey: ['key'],
      queryFn: () => Promise.resolve(5),
      // @ts-expect-error this is a good error, because stallTime does not exist!
      stallTime: 1000,
    })
  })

  test('Should infer types for callbacks', () => {
    queryOptions({
      queryKey: ['key'],
      queryFn: () => Promise.resolve(5),
      staleTime: 1000,
      select: (data) => {
        expectTypeOf(data).toEqualTypeOf<number>()
      },
    })
  })

  test('Should work when passed to fetchQuery', async () => {
    const options = queryOptions({
      queryKey: ['key'],
      queryFn: () => Promise.resolve(5),
    })

    const data = await new QueryClient().fetchQuery(options)
    expectTypeOf(data).toEqualTypeOf<number>()
  })

  test('Should work when passed to createQueries', () => {
    const options = queryOptions({
      queryKey: ['key'],
      queryFn: () => Promise.resolve(5),
    })

    const queries = createQueries(() => ({
      queries: [options],
    }))

    expectTypeOf(queries[0].data).toEqualTypeOf<number | undefined>()
  })

  test('Should tag the queryKey with the result type of the QueryFn', () => {
    const { queryKey } = queryOptions({
      queryKey: ['key'],
      queryFn: () => Promise.resolve(5),
    })

    expectTypeOf(queryKey[dataTagSymbol]).toEqualTypeOf<number>()
  })

  test('Should tag the queryKey even if no promise is returned', () => {
    const { queryKey } = queryOptions({
      queryKey: ['key'],
      queryFn: () => 5,
    })

    expectTypeOf(queryKey[dataTagSymbol]).toEqualTypeOf<number>()
  })

  test('Should tag the queryKey with unknown if there is no queryFn', () => {
    const { queryKey } = queryOptions({
      queryKey: ['key'],
    })

    expectTypeOf(queryKey[dataTagSymbol]).toEqualTypeOf<unknown>()
  })

  test('Should tag the queryKey with the result type of the QueryFn if select is used', () => {
    const { queryKey } = queryOptions({
      queryKey: ['key'],
      queryFn: () => Promise.resolve(5),
      select: (data) => data.toString(),
    })

    expectTypeOf(queryKey[dataTagSymbol]).toEqualTypeOf<number>()
  })

  test('Should return the proper type when passed to getQueryData', () => {
    const { queryKey } = queryOptions({
      queryKey: ['key'],
      queryFn: () => Promise.resolve(5),
    })

    const queryClient = new QueryClient()
    const data = queryClient.getQueryData(queryKey)
    expectTypeOf(data).toEqualTypeOf<number | undefined>()
  })

  test('Should return the proper type when passed to getQueryState', () => {
    const { queryKey } = queryOptions({
      queryKey: ['key'],
      queryFn: () => Promise.resolve(5),
    })

    const queryClient = new QueryClient()
    const state = queryClient.getQueryState(queryKey)
    expectTypeOf(state?.data).toEqualTypeOf<number | undefined>()
  })

  test('Should properly type updaterFn when passed to setQueryData', () => {
    const { queryKey } = queryOptions({
      queryKey: ['key'],
      queryFn: () => Promise.resolve(5),
    })

    const queryClient = new QueryClient()
    const data = queryClient.setQueryData(queryKey, (prev) => {
      expectTypeOf(prev).toEqualTypeOf<number | undefined>()
      return prev
    })
    expectTypeOf(data).toEqualTypeOf<number | undefined>()
  })

  test('Should properly type value when passed to setQueryData', () => {
    const { queryKey } = queryOptions({
      queryKey: ['key'],
      queryFn: () => Promise.resolve(5),
    })

    const queryClient = new QueryClient()

    // @ts-expect-error value should be a number
    queryClient.setQueryData(queryKey, '5')
    // @ts-expect-error value should be a number
    queryClient.setQueryData(queryKey, () => '5')

    const data = queryClient.setQueryData(queryKey, 5)
    expectTypeOf(data).toEqualTypeOf<number | undefined>()
  })

  test('Should infer even if there is a conditional skipToken', () => {
    const options = queryOptions({
      queryKey: ['key'],
      queryFn: Math.random() > 0.5 ? skipToken : () => Promise.resolve(5),
    })

    const queryClient = new QueryClient()
    const data = queryClient.getQueryData(options.queryKey)
    expectTypeOf(data).toEqualTypeOf<number | undefined>()
  })

  test('Should infer to unknown if we disable a query with just a skipToken', () => {
    const options = queryOptions({
      queryKey: ['key'],
      queryFn: skipToken,
    })

    const queryClient = new QueryClient()
    const data = queryClient.getQueryData(options.queryKey)
    expectTypeOf(data).toEqualTypeOf<unknown>()
  })

  test('Should return the proper type when passed to QueriesObserver', () => {
    const options = queryOptions({
      queryKey: ['key'],
      queryFn: () => Promise.resolve(5),
    })

    const queryClient = new QueryClient()
    const queriesObserver = new QueriesObserver(queryClient, [options])
    expectTypeOf(queriesObserver).toEqualTypeOf<
      QueriesObserver<Array<QueryObserverResult>>
    >()
  })

  test('Should allow undefined response in initialData', () => {
    return (id: string | null) =>
      queryOptions({
        queryKey: ['todo', id],
        queryFn: () =>
          Promise.resolve({
            id: '1',
            title: 'Do Laundry',
          }),
        initialData: () =>
          !id
            ? undefined
            : {
                id,
                title: 'Initial Data',
              },
      })
  })
})
