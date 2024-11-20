<script lang="ts">
    import PersonForm from '$lib/components/PersonForm.svelte';
    import PersonList from '$lib/components/PersonList.svelte';
    import GroupSettings from '$lib/components/GroupSettings.svelte';
    import GroupDisplay from '$lib/components/GroupDisplay.svelte';
    import CopyGroups from '$lib/components/CopyGroups.svelte';

    import { people, groups, groupSettings } from '$lib/stores';
    import { goto } from '$app/navigation';
    import { formatGroupsAsText } from '$lib/utils/formatGroups';

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
    let buttonText = "Copiar Grupos";

    async function copyGroupsToClipboard() {
        const text = formatGroupsAsText($groups, $groupSettings.requireLeader);
        try {
            await navigator.clipboard.writeText(text);
            buttonText = "Copiado";
            setTimeout(() => {
                buttonText = "Copiar Grupos";
            }, 2000);
        } catch (error) {
            console.error("Failed to copy text:", error);
        }
    }

    function startGroupGeneration() {
        showGroups = true;
    }
</script>

<div class="h-screen flex flex-col">
{#if !showGroups}
    <div class="container mx-auto px-4 max-w-lg flex-1 flex flex-col">
        <div class="sticky top-0 pt-4 pb-4 z-10 bg-white dark:bg-gray-900">
            <PersonForm 
                bind:this={personForm}
                on:personAdded={event => personForm?.handlePersonAdded?.(event)}
            />
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
        <div class="sticky bottom-0 pt-4 pb-6 bg-white dark:bg-gray-900">
            <button
                on:click={startGroupGeneration}
                class="w-full flex items-center justify-center flex-wrap px-6 py-3 gap-x-4 gap-y-2 font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed"
                disabled={$people.length < 2}
            >
                <span>Grupos</span>
                {#if $people.filter(p => !p.isMissing).length > 0}
                    <span class="bg-white/20 dark:bg-black/20 px-2 py-1 rounded text-sm whitespace-nowrap">
                        {$people.filter(p => !p.isMissing).length} pessoa{$people.filter(p => !p.isMissing).length > 1 ? 's' : ''}
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
                <GroupSettings>
                    <div slot="copy-button">
                        <button
                            on:click={copyGroupsToClipboard}
                            class="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold whitespace-nowrap disabled:bg-gray-400 dark:disabled:bg-gray-600"
                            disabled={!$groups || $groups.length === 0}
                        >
                            {buttonText}
                        </button>
                    </div>
                </GroupSettings>
            </div>
            <div class="flex-1">
                <div class="space-y-6">
                    <GroupDisplay />
                </div>
            </div>
            {#if !isKeyboardOpen}
            <div class="sticky bottom-0 pt-4 pb-6 bg-white dark:bg-gray-900">
                <button
                    type="button"
                    on:click={() => showGroups = false}
                    class="w-full px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-600 dark:hover:bg-gray-700 font-bold"
                >
                    Voltar
                </button>
            </div>
            {/if}
        </div>
    </div>
{/if}
</div>
