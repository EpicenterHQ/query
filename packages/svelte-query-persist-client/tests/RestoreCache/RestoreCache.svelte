<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'
  import type { StatelessRef, StatusResult } from '../utils.svelte.js'

  let { states }: { states: StatelessRef<Array<StatusResult<string>>> } =
    $props()

  const query = createQuery(() => ({
    queryKey: ['test'],
    queryFn: async () => Promise.resolve('fetched'),
  }))

  $effect(() => {
    // svelte-ignore state_snapshot_uncloneable
    const snapshot = $state.snapshot(query)
    states.current.push(snapshot)
  })
</script>

<div>{query.data}</div>
<div>fetchStatus: {query.fetchStatus}</div>
