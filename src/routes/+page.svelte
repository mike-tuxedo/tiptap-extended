<script>
    import TipTap from "$lib/TipTap.svelte";

    let editor;
</script>

<svelte:head>
    <link rel="stylesheet" href="style.css" />
</svelte:head>

<TipTap bind:editor={editor} />