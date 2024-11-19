<script lang="ts">
    import GroupSettings from '$lib/components/GroupSettings.svelte';
    import GroupDisplay from '$lib/components/GroupDisplay.svelte';
    import CopyGroupsFooter from '$lib/components/CopyGroupsFooter.svelte';
</script>

<div class="h-screen flex flex-col">
    <div class="container mx-auto px-4 max-w-lg flex-1 flex flex-col">
        <div class="sticky top-0 pt-4 pb-4 z-10 bg-white">
            <GroupSettings />
        </div>
        <div class="flex-1">
            <div class="space-y-6">
                <GroupDisplay />
            </div>
        </div>
        <div class="sticky bottom-0 pt-4 pb-4 bg-white">
            <CopyGroupsFooter />
        </div>
    </div>
</div>
