<script lang="ts">
    import { groups } from '$lib/stores';
    import { formatGroupsAsText } from '$lib/utils/formatGroups';

    let buttonText = "Copiar Grupos";

    async function copyGroupsToClipboard() {
        const text = formatGroupsAsText($groups);
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

{#if $groups.length > 0}
<button
    on:click={copyGroupsToClipboard}
    class="w-full max-w-lg mx-auto px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold"
>
    {buttonText}
</button>
{/if}
