<script lang="ts">
    import { groupSettings, regenerateGroups, people } from '$lib/stores';
    import { goto } from '$app/navigation';

    let settings = $groupSettings;
    $: hasLeaders = $people.some(p => p.isLeader);
    $: if (!hasLeaders) {
        settings.requireLeader = false;
    }
    $: $groupSettings = settings;

    function decrementPeoplePerGroup() {
        if (settings.peoplePerGroup > 2) {
            settings.peoplePerGroup--;
        }
    }

    function incrementPeoplePerGroup() {
        settings.peoplePerGroup++;
    }

    function handleInput(event: Event) {
        const input = event.target as HTMLInputElement;
        const value = input.value.replace(/[^0-9]/g, '');
        const numValue = parseInt(value) || 2;
        settings.peoplePerGroup = Math.max(2, numValue);
        input.value = settings.peoplePerGroup.toString();
    }
</script>

<div class="p-4 bg-white rounded-lg shadow">
    <div class="space-y-4">
        <div class="flex items-center gap-2">
            <label class="flex-1 flex items-center">
                <button
                    on:click={decrementPeoplePerGroup}
                    class="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-l border border-r-0"
                    aria-label="Diminuir pessoas por grupo"
                >
                    -
                </button>
                <input
                    type="text"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    value={settings.peoplePerGroup}
                    on:input={handleInput}
                    class="w-12 px-3 py-2 border-y text-center"
                />
                <button
                    on:click={incrementPeoplePerGroup}
                    class="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-r border border-l-0"
                    aria-label="Aumentar pessoas por grupo"
                >
                    +
                </button>
                <span class="ml-2">por grupo</span>
            </label>
        </div>

        <label class="flex items-center gap-2">
            <input
                type="checkbox"
                bind:checked={settings.separateGenders}
                class="text-blue-600"
            />
            <span>Separado por sexo</span>
        </label>

        <label class="flex items-center gap-2">
            <input
                type="checkbox"
                bind:checked={settings.requireLeader}
                class="text-green-600"
                disabled={!hasLeaders}
            />
            <span class={!hasLeaders ? 'text-gray-400' : ''}>
                Um líder por grupo
            </span>
        </label>
    </div>

    <div class="mt-6 flex gap-2">
        <button
            on:click={regenerateGroups}
            class="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            disabled={$people.length < 2}
        >
            Gerar Grupos
        </button>
        <button
            type="button"
            on:click={() => goto('/')}
            class="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
        >
            Voltar
        </button>
    </div>
</div>
