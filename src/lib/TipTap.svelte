<script>
    /** Svelte Imports */
    import { onMount, onDestroy } from "svelte";
    import { fade, fly, scale, slide } from "svelte/transition";

    /** TipTap Imports */
    import { Editor } from "@tiptap/core";
    import BubbleMenu from "@tiptap/extension-bubble-menu";
    import StarterKit from "@tiptap/starter-kit";
    import TextAlign from "@tiptap/extension-text-align";
    import Blockquote from "@tiptap/extension-blockquote";
    import CodeBlock from "@tiptap/extension-code-block";
    import HorizontalRule from "@tiptap/extension-horizontal-rule";
    import Youtube from "@tiptap/extension-youtube";
    import Dropcursor from "@tiptap/extension-dropcursor";
    import Placeholder from "@tiptap/extension-placeholder";
    import Image from "@tiptap/extension-image";
    import Link from "@tiptap/extension-link";
    import History from "@tiptap/extension-history";

    /** Custom Imports */
    import CustomTiptapYoutube from "$lib/CustomTipTapYoutube.js";
    import CustomTiptapImage from "$lib/CustomTipTapImage.js";
    import Icon from "$lib/Icon.svelte";
    import { clickOutsideAction } from "svelte-legos";

    export let content = "";
    export let editor;
    let editorElement;
    let editorOuterElement;
    let bubbleMenu;
    let fixedMenu;
    let selectedMedia = null;
    let selectedParagraph = null;
    let currentNode = null;
    let changedCount = 1;
    let mouseY = 0;
    let url = "";
    let urlModal;
    let urlInput;
    let baseurl;

    const allowedMimeTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "application/pdf",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.oasis.opendocument.spreadsheet",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.oasis.opendocument.text",
    ];

    onMount(() => {
        editor = new Editor({
            element: editorElement,
            extensions: [
                StarterKit,
                TextAlign.configure({
                    types: ["heading", "paragraph"],
                }),
                // BubbleMenu.configure({
                //     element: bubbleMenu,
                // }),
                BubbleMenu.configure({
                    pluginKey: 'nodesBubbleMenu',
                    element: bubbleMenu,
                }),
                BubbleMenu.configure({
                    pluginKey: 'fixedBubbleMenu',
                    element: fixedMenu,
                }),
                Blockquote,
                CodeBlock,
                HorizontalRule,
                Dropcursor,
                Youtube,
                CustomTiptapYoutube,
                CustomTiptapImage.configure({
                    inline: false,
                    allowBase64: false,
                }),
                Image,
                Placeholder.configure({
                    placeholder:
                        "Now free your mind - start typing, drag n drop an image or paste a youtube link, what ever you like ...",
                }),
                Link.configure({
                    openOnClick: false,
                    HTMLAttributes: {
                        target: null,
                    },
                }),
            ],
            content: content,
            onUpdate: ({ editor }) => {
                updateSelectedMedia(editor);
                content = editor.getHTML();
            },
        });

        editorElement.addEventListener("paste", handlePaste);
        editorElement.addEventListener("drop", handleDrop);
        editorElement.addEventListener("click", handleClick);
        editorElement.addEventListener("mousedown", handleMouseDown);
    });

    onDestroy(() => {
        console.log("destroy tiptap?", editorElement);
        if (editor) {
            editor.destroy();
        }

        if (editorElement) {
            editorElement.removeEventListener("paste", handlePaste);
            editorElement.removeEventListener("drop", handleDrop);
            editorElement.addEventListener("click", handleClick);
            editorElement.addEventListener("mousedown", handleMouseDown);
        }
    });

    function setSelectedNode(event) {
        const { target } = event;
        selectedMedia = null;
        selectedParagraph = null;

        setTimeout(() => {
            mouseY = event.clientY;

            if (
                target.tagName === "IMG" ||
                target.hasAttribute("data-youtube-video")
            ) {
                selectedMedia = target;
                currentNode = target;
                selectedParagraph = null;
                console.log(selectedMedia);
            } else if (
                [
                    "P",
                    "H1",
                    "H2",
                    "H3",
                    "H4",
                    "STRONG",
                    "CODE",
                    "PRE",
                    "DIV",
                    "UL",
                    "OL",
                    "LI",
                    "EM",
                    "A",
                ].includes(target.tagName)
            ) {
                selectedParagraph = target;
                currentNode = target;
                selectedMedia = null;
            }
        }, 50);
    }

    function handleClick(event) {
        setSelectedNode(event);
    }

    function handleMouseDown(event) {}

    function updateSelectedMedia(editor) {
        const { doc, selection } = editor.state;
        const node = doc.nodeAt(selection.from);
        
        if (node?.type.name === "image" || node?.type.name === "div") {
            selectedMedia = editor.view.domAtPos(selection.from).node;
        } else {
            selectedMedia = null;
        }
    }

    async function handlePaste(event) {
        setSelectedNode(event);

        const files = Array.from(event.clipboardData.files);
        if (files.length > 0) {
            for (const file of files) {
                await uploadFile(file);
            }
        } else {
            const text = event.clipboardData.getData("text");
            if (isYouTubeLink(text)) {
                editor.commands.setYoutubeVideo({
                    src: text,
                });
            }
        }
    }

    async function handleDrop(event) {
        setSelectedNode(event);

        const items = event.dataTransfer.items;
        if (items.length === 0) return;

        event.preventDefault();
        const pos = editor.view.posAtCoords({
            left: event.clientX,
            top: event.clientY,
        });

        for (const item of items) {
            if (item.kind === "file") {
                const file = item.getAsFile();
                await uploadFile(file, pos.pos);
            } else if (
                item.kind === "string" &&
                item.type === "text/uri-list"
            ) {
                const url = await new Promise((resolve) =>
                    item.getAsString(resolve)
                );
                if (isImageUrl(url)) {
                    await uploadImageFromUrl(url, pos.pos);
                }
            }
        }
    }

    async function handleUpload(event) {
        uploadFile(event.target.files[0]);
    }

    async function uploadFile(file, pos = null) {
        editor
            .chain()
            .focus()
            .insertContentAt(
                pos,
                `<img src="https://fastly.picsum.photos/id/1018/200/300.jpg?hmac=IrYgAIczHOxOgmWliW3MlASD3LdAJ_aHAdh5f2aY9Sw" alt="${file.name}"alt="${file.name}"/>`
            )
            .run();
    }

    function isYouTubeLink(text) {
        const youtubeRegex =
            /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
        return youtubeRegex.test(text);
    }

    function isImageUrl(url) {
        return /\.(jpeg|jpg|gif|png|webp)$/i.test(url);
    }

    function applyImageWidth(htmlClass) {
        if (selectedMedia) {
            editor.commands.updateAttributes("image", {
                widthClass: htmlClass,
            });
            editor.commands.updateAttributes("youtube", {
                widthClass: htmlClass,
            });
            changedCount++;
        }
    }

    function applyImageFloats(htmlClass) {
        if (selectedMedia) {
            editor.commands.updateAttributes("image", {
                alignClass: htmlClass,
            });
            editor.commands.updateAttributes("youtube", {
                alignClass: htmlClass,
            });
            changedCount++;
        }
    }

    function applyImageAlignment(htmlClass) {
        if (selectedMedia) {
            editor.commands.updateAttributes("image", {
                alignClass: htmlClass,
            });
            editor.commands.updateAttributes("youtube", {
                alignClass: htmlClass,
            });
            changedCount++;
        }
    }

    function deleteImage() {
        if (selectedMedia) {
            editor.commands.deleteSelection();
            selectedMedia = null;
        }
    }

    function handleClickOutside() {
        selectedMedia = null;
        selectedParagraph = null;
    }

    function showUrlModal() {
        urlModal.show();
        const previousUrl = editor.getAttributes("link").href;
        url = previousUrl;
        urlInput.focus();
    }

    function setLink() {
        // cancelled
        if (url === null) {
            return;
        }

        // empty
        if (url === "") {
            editor.chain().focus().extendMarkRange("link").unsetLink().run();

            return;
        }

        // update link
        editor
            .chain()
            .focus()
            .extendMarkRange("link")
            .setLink({ href: url })
            .run();

        if (url) {
            editor
                .chain()
                .focus()
                .extendMarkRange("link")
                .setLink({ href: url })
                .run();
            url = ""; // Clear the input after setting the link
        }
        changedCount++;
        urlModal.close();
    }

    function unsetLink() {
        editor.chain().focus().unsetLink().run();
        changedCount++;
    }

    $: if (editor && editor.isActive("heading", { level: 1 })) console.log('###');
    $: console.log(currentNode);
</script>

<div
    class="relative"
    use:clickOutsideAction={handleClickOutside}
    bind:this={editorOuterElement}
>
    <div
        bind:this={bubbleMenu}
        class="tiptap-controls absolute top-0 flex bubble-menu"
    >
        {#if selectedParagraph}
            <button
                on:click={() => {
                    editor
                        .chain()
                        .focus()
                        .toggleHeading({ level: 1 })
                        .run();
                    changedCount++;
                }}
                class:active={currentNode && currentNode.nodeName === 'H1'}
            >
                <Icon name="heading-1" />
            </button>
            <button
                on:click={() => {
                    editor
                        .chain()
                        .focus()
                        .toggleHeading({ level: 2 })
                        .run();
                    changedCount++;
                }}
            >
                <Icon name="heading-2" />
            </button>
            <button
                on:click={() => {
                    editor
                        .chain()
                        .focus()
                        .toggleHeading({ level: 3 })
                        .run();
                    changedCount++;
                }}
            >
                <Icon name="heading-3" />
            </button>
            <button
                on:click={() => {
                    editor
                        .chain()
                        .focus()
                        .toggleHeading({ level: 4 })
                        .run();
                    changedCount++;
                }}
            >
                <Icon name="heading-4" />
            </button>
            <button
                on:click={() => {
                    editor.chain().focus().toggleBold().run();
                    changedCount++;
                }}
            >
                <Icon name="bold" />
            </button>
            <button
                on:click={() => {
                    editor.chain().focus().toggleItalic().run();
                    changedCount++;
                }}
            >
                <Icon name="italic" />
            </button>
            <button
                on:click={() => {
                    editor.chain().focus().toggleBulletList().run();
                    changedCount++;
                }}
            >
                <Icon name="bullet-list" />
            </button>
            <button
                on:click={() => {
                    editor.chain().focus().toggleOrderedList().run();
                    changedCount++;
                }}
            >
                <Icon name="ordered-list" />
            </button>
            <div style="border-right: 1px solid #888; height: 28px" />
            <button
                on:click={() => {
                    editor.chain().focus().setTextAlign("left").run();
                    changedCount++;
                }}
            >
                <Icon name="align-left" />
            </button>
            <button
                on:click={() => {
                    editor.chain().focus().setTextAlign("center").run();
                    changedCount++;
                }}
            >
                <Icon name="align-center" />
            </button>
            <button
                on:click={() => {
                    editor.chain().focus().setTextAlign("right").run();
                    changedCount++;
                }}
            >
                <Icon name="align-right" />
            </button>
            <div style="border-right: 1px solid #888; height: 28px" />
            <button
                on:click={() => {
                    editor.chain().focus().toggleBlockquote().run();
                    changedCount++;
                }}
            >
                <Icon name="blockquote" />
            </button>
            <button
                on:click={() => {
                    editor.chain().focus().toggleCodeBlock().run();
                    changedCount++;
                }}
            >
                <Icon name="code-block" />
            </button>
            <button
                on:click={() => {
                    {
                        editor.chain().focus().setHorizontalRule().run();
                        changedCount++;
                    }
                }}
            >
                <Icon name="horizontal-rule" />
            </button>

            <button on:click={showUrlModal}> Link </button>
            <button
                on:click={unsetLink}
                disabled={!editor?.isActive("link")}
            >
                Unlink
            </button>

            <button class="relative">
                <Icon name="image" />
                <input
                    class="absolute w-full h-full top-0 left-0 opacity-0"
                    type="file"
                    accept="image/*"
                    on:change={(event) => handleUpload(event)}
                />
            </button>
        {:else if selectedMedia}
            <button on:click={() => applyImageWidth("w-full")}
                ><Icon name="full-width" /></button
            >
            <button on:click={() => applyImageWidth("w-1/2")}
                ><Icon name="resize" /></button
            >
            <button on:click={() => applyImageWidth("w-1/4")}
                ><Icon name="resize-small" /></button
            >
            <div style="border-right: 1px solid #888; height: 28px" />
            <button on:click={() => applyImageFloats("float-left")}
                ><Icon name="float-left" /></button
            >
            <button on:click={() => applyImageAlignment("mr-auto")}
                ><Icon name="align-left" /></button
            >
            <button on:click={() => applyImageAlignment("mx-auto")}
                ><Icon name="align-center" /></button
            >
            <button on:click={() => applyImageAlignment("ml-auto")}
                ><Icon name="align-right" /></button
            >
            <button on:click={() => applyImageFloats("float-right")}
                ><Icon name="float-right" /></button
            >
            <div
                style="border-right: 1px solid #888; margin-top: 8px; height: 28px"
            />
            <button on:click={deleteImage}><Icon name="trash" /></button>
        {/if}

    </div>
    
    <div bind:this={fixedMenu} class="fixed-controls">
        {#if editor}
            <button
                on:click={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
            >
                Undo
            </button>
            <button
                on:click={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
            >
                Redo
            </button>
        {/if}
    </div>

    <div bind:this={editorElement} class="tiptap-editor"></div>

    <dialog class="modal" bind:this={urlModal}>
        <div class="modal-box">
            <form method="dialog">
                <button
                    class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                    >✕</button
                >
            </form>

            <label class="form-control w-full">
                <div class="label">
                    <span class="label-text">Link</span>
                </div>
                <input
                    type="text"
                    bind:value={url}
                    bind:this={urlInput}
                    placeholder="Enter URL"
                    class="input input-bordered"
                />
            </label>
            <div class="modal-action">
                <form method="dialog">
                    <button class="btn" on:click={setLink}>Set</button>
                </form>
            </div>
        </div>
    </dialog>
</div>
