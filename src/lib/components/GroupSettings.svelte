<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { groupSettings, regenerateGroups, people, groups, isRegenerating } from '$lib/stores';
    import { goto } from '$app/navigation';
    import CopyGroups from '$lib/components/CopyGroups.svelte';

    const dispatch = createEventDispatcher();

    let settings = $groupSettings;
    $: hasLeaders = $people.some(p => p.isLeader);
    $: if (!hasLeaders) {
        settings.requireLeader = false;
    }
    $: $groupSettings = settings;

    function decrementPeoplePerGroup() {
        if (settings.peoplePerGroup > 2) {
            settings.peoplePerGroup--;
            $groups = null;
        }
    }

    function incrementPeoplePerGroup() {
        settings.peoplePerGroup++;
        $groups = null;
    }

    function handleInput(event: Event) {
        const input = event.target as HTMLInputElement;
        const value = input.value.replace(/[^0-9]/g, '');
        const numValue = parseInt(value) || 2;
        settings.peoplePerGroup = Math.max(2, numValue);
        input.value = settings.peoplePerGroup.toString();
        $groups = null;
    }
</script>

<div class="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
    <div class="flex flex-wrap items-start justify-between gap-x-4 gap-y-4">
        <div class="flex items-center gap-2">
            <label class="flex-1 flex items-center">
                <button
                    on:click={decrementPeoplePerGroup}
                    class="px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-l border border-r-0 dark:border-gray-600 dark:text-white"
                    aria-label="Diminuir pessoas por grupo"
                >
                    -
                </button>
                <div class="flex items-center border-y dark:border-gray-600">
                    <input
                        type="text"
                        inputmode="numeric"
                        pattern="[0-9]*"
                        value={settings.peoplePerGroup}
                        on:input={handleInput}
                        autocomplete="off"
                        class="sr-only"
                    />
                    <span class="px-3 py-2 dark:text-white">{settings.peoplePerGroup} por grupo</span>
                </div>
                <button
                    on:click={incrementPeoplePerGroup}
                    class="px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-r border border-l-0 dark:border-gray-600 dark:text-white"
                    aria-label="Aumentar pessoas por grupo"
                >
                    +
                </button>
            </label>
        </div>

        <div class="flex flex-col">
          <label class="flex items-center gap-2 whitespace-nowrap">
              <input
                  type="checkbox"
                  bind:checked={settings.separateGenders}
                  on:change={() => $groups = null}
                  class="text-blue-600"
              />
              <span>Separado por sexo</span>
          </label>

          <label class="flex items-center gap-2 whitespace-nowrap">
              <input
                  type="checkbox"
                  bind:checked={settings.requireLeader}
                  on:change={() => $groups = null}
                  class="text-green-600"
                  disabled={!hasLeaders}
              />
              <span class={!hasLeaders ? 'text-gray-400' : ''}>
                  Um líder por grupo
              </span>
          </label>
        </div>
    </div>

    <div class="mt-4 grid grid-cols-2 gap-2">
        <button
            on:click={regenerateGroups}
            class="w-full px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600"
            disabled={$people.length < 2 && !$isRegenerating}
        >
            {#if ( $groups && $groups.length > 0 ) || $isRegenerating}Reagrupar{:else}Agrupar{/if}
        </button>
        <CopyGroups/>
    </div>
</div>
