<script lang="ts">
    import PersonForm from '$lib/components/PersonForm.svelte';
    import PersonList from '$lib/components/PersonList.svelte';
    import GroupSettings from '$lib/components/GroupSettings.svelte';
    import GroupDisplay from '$lib/components/GroupDisplay.svelte';
    import CopyGroupsFooter from '$lib/components/CopyGroupsFooter.svelte';

    import { people } from '$lib/stores';
    import { goto } from '$app/navigation';

    import { onMount } from 'svelte';
    let isKeyboardOpen = false;
    let initialWindowHeight;

    onMount(() => {
        initialWindowHeight = window.innerHeight;
        const checkKeyboard = () => {
            // If window height is significantly smaller than initial height,
            // keyboard is likely open (using 150px as threshold)
            isKeyboardOpen = window.innerHeight < initialWindowHeight - 150;
        };

        window.addEventListener('resize', checkKeyboard);
        return () => {
            window.removeEventListener('resize', checkKeyboard);
        };
    });

    let personForm: PersonForm;
    let showGroups = false;

    function startGroupGeneration() {
        showGroups = true;
    }
</script>

<div class="h-screen flex flex-col">
{#if !showGroups}
    <div class="container mx-auto px-4 max-w-lg flex-1 flex flex-col">
        <div class="sticky top-0 pt-4 pb-4 z-10 bg-white dark:bg-gray-900">
            <PersonForm bind:this={personForm} />
        </div>

        <div class="flex-1">
            <div class="space-y-6">
                {#if $people.length === 0}
                    <div class="text-center text-gray-500 py-8">
                        Adicione uma pessoa acima
                    </div>
                {:else}
                <PersonList {personForm} />
                {/if}
            </div>
        </div>

        {#if !isKeyboardOpen}
        <div class="sticky bottom-0 pt-4 pb-4 bg-white dark:bg-gray-900">
            <button
                on:click={startGroupGeneration}
                class="w-full px-6 py-3 font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed"
                disabled={$people.length < 2}
            >
                Grupos
                {#if $people.length > 0}
                    <span class="bg-white/20 dark:bg-black/20 px-2 py-1 ml-2 rounded text-sm">
                        {$people.length} pessoa{$people.length > 1 ? 's' : ''}
                    </span>
                {/if}
            </button>
        </div>
        {/if}
    </div>
{:else}
    <div class="h-screen flex flex-col">
        <div class="container mx-auto px-4 max-w-lg flex-1 flex flex-col">
            <div class="sticky top-0 pt-4 pb-4 z-10 bg-white dark:bg-gray-900">
                <GroupSettings on:back={() => showGroups = false} />
            </div>
            <div class="flex-1">
                <div class="space-y-6">
                    <GroupDisplay />
                </div>
            </div>
            {#if !isKeyboardOpen}
            <div class="sticky bottom-0 pt-4 pb-4 bg-white dark:bg-gray-900">
                <CopyGroupsFooter />
            </div>
            {/if}
        </div>
    </div>
{/if}
</div>
