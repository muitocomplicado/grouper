<script lang="ts">
    import { groups } from '$lib/stores';
    import { formatGroupsAsText } from '$lib/utils/formatGroups';

    function copyGroupsToClipboard() {
        const text = formatGroupsAsText($groups);
        navigator.clipboard.writeText(text);
    }
</script>

{#if $groups.length > 0}
<button
    on:click={copyGroupsToClipboard}
    class="w-full max-w-lg mx-auto px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg"
>
    Copiar Grupos
</button>
{/if}
