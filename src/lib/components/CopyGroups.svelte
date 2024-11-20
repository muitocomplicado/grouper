<script lang="ts">
    import { groups, groupSettings, isRegenerating } from '$lib/stores';
    import { formatGroupsAsText } from '$lib/utils/formatGroups';

    let buttonText = "Copiar";

    async function copyGroupsToClipboard() {
        const text = formatGroupsAsText($groups, $groupSettings.requireLeader);
        try {
            await navigator.clipboard.writeText(text);
            buttonText = "Copiado";
            setTimeout(() => {
                buttonText = "Copiar";
            }, 2000);
        } catch (error) {
            console.error("Failed to copy text:", error);
        }
    }
</script>

<button
    on:click={copyGroupsToClipboard}
    class="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
    disabled={(!$groups || $groups.length === 0) && !$isRegenerating}
>
    {buttonText}
</button>
