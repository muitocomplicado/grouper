<script lang="ts">
    import { groups, groupSettings } from '$lib/stores';
    import { formatGroupsAsText } from '$lib/utils/formatGroups';

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
</script>

<div class="flex flex-col gap-4">
    {#if $groups.length > 0}
    <button
        on:click={copyGroupsToClipboard}
        class="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold disabled:bg-gray-400 dark:disabled:bg-gray-600"
        disabled={!$groups || $groups.length === 0}
    >
        {buttonText}
    </button>
    {/if}
</div>
