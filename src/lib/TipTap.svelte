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
    import Table from "@tiptap/extension-table";
    import TableCell from "@tiptap/extension-table-cell";
    import TableHeader from "@tiptap/extension-table-header";
    import TableRow from "@tiptap/extension-table-row";
    import Focus from "@tiptap/extension-focus";
    import { PluginKey } from "@tiptap/pm/state";
    import { Grid } from "./CustomTipTapGrid";

    /** Custom Imports */
    import CustomTiptapYoutube from "$lib/CustomTipTapYoutube.js";
    import CustomTiptapImage from "$lib/CustomTipTapImage.js";
    import Icon from "$lib/Icon.svelte";
    import { clickOutsideAction } from "svelte-legos";

    export let content = "";
    export let style = "";
    export let baseurl = "";
    let editor;
    let editorElement;
    let editorOuterElement;
    let bubbleNodeMenu;
    let bubbleImageMenu;
    let bubbleTableMenu;
    let fixedMenu;
    let selectedMedia = null;
    let selectedParagraph = null;
    let currentNode = null;
    let mouseY = 0;
    let url = "";
    let urlModal;
    let urlInput;

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
                BubbleMenu.configure({
                    pluginKey: new PluginKey("nodesBubbleMenu"),
                    element: bubbleNodeMenu,
                    tippyOptions: {
                        offset: [-100, 50],
                    },
                    shouldShow: ({
                        editor,
                        view,
                        state,
                        oldState,
                        from,
                        to,
                    }) => {
                        return (
                            !editor.isActive("image") &&
                            !editor.isActive("table")
                        );
                    },
                }),
                BubbleMenu.configure({
                    pluginKey: new PluginKey("imageBubbleMenu"),
                    element: bubbleImageMenu,
                    shouldShow: ({
                        editor,
                        view,
                        state,
                        oldState,
                        from,
                        to,
                    }) => {
                        return editor.isActive("image");
                    },
                }),
                BubbleMenu.configure({
                    pluginKey: new PluginKey("tableBubbleMenu"),
                    element: bubbleTableMenu,
                    tippyOptions: {
                        offset: [0, 70],
                    },
                    shouldShow: ({
                        editor,
                        view,
                        state,
                        oldState,
                        from,
                        to,
                    }) => {
                        return editor.isActive("table");
                    },
                }),
                Focus.configure({
                    className: "has-focus",
                    mode: "all",
                }),
                Blockquote,
                CodeBlock,
                Table.configure({
                    resizable: true,
                }),
                TableRow,
                TableHeader,
                TableCell,
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
                Grid,
            ],
            editorProps: {
                attributes: {
                    class: "prose prose-sm sm:prose-base lg:prose-lg xl:prose-2xl focus:outline-none",
                },
            },
            content: content,
            onUpdate: ({ editor }) => {
                updateSelectedMedia(editor);
                content = editor.getHTML();
            },
            onTransaction: () => {
                // force re-render so `editor.isActive` works as expected
                if (editor) editor = editor;
            },
        });

        editorElement.addEventListener("paste", handlePaste);
        editorElement.addEventListener("drop", handleDrop);
        editorElement.addEventListener("mousedown", handleMouseDown);
        editorElement.addEventListener("keyup", handleKeyUp);
        editorElement.addEventListener("keydown", handleKeyDown);
    });

    onDestroy(() => {
        if (editor) {
            editor.destroy();
        }

        if (editorElement) {
            editorElement.removeEventListener("paste", handlePaste);
            editorElement.removeEventListener("drop", handleDrop);
            editorElement.addEventListener("mousedown", handleMouseDown);
            editorElement.addEventListener("keyup", handleKeyUp);
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

    function handleKeyUp() {}

    function handleKeyDown(event) {
        
        if (event.key === "Enter" && event.ctrlKey) {
            console.log('exitCode');
            return editor.commands.splitBlock();
        }
        return false;
    }

    function handleMouseDown(event) {
        setSelectedNode(event);
    }

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
        fetch("https://picsum.photos/600/300")
            .then((response) => response.url)
            .then((src) => {
                console.log(src);
                editor
                    .chain()
                    .focus()
                    .insertContentAt(
                        pos,
                        `<img src="${src}" alt="${file.name}"alt="${file.name}"/>`
                    )
                    .run();
            });
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

        urlModal.close();
    }

    function unsetLink() {
        editor.chain().focus().unsetLink().run();
    }
</script>

<div
    class="relative"
    use:clickOutsideAction={handleClickOutside}
    bind:this={editorOuterElement}
>
    <div
        bind:this={bubbleNodeMenu}
        class="tiptap-controls absolute top-0 flex bubble-menu"
    >
        <!-- <button
            on:click={() => {
                editor.chain().focus().toggleParagraph().run();
            }}
            class:active={editor?.isActive('paragraph')}
        >
            <Icon name="paragraph" />
        </button> -->
        <button
            on:click={() => {
                editor.chain().focus().toggleHeading({ level: 1 }).run();
            }}
            class:active={editor?.isActive("heading", { level: 1 })}
        >
            <Icon name="heading-1" />
        </button>
        <button
            on:click={() => {
                editor.chain().focus().toggleHeading({ level: 2 }).run();
            }}
            class:active={editor?.isActive("heading", { level: 2 })}
        >
            <Icon name="heading-2" />
        </button>
        <button
            on:click={() => {
                editor.chain().focus().toggleHeading({ level: 3 }).run();
            }}
            class:active={editor?.isActive("heading", { level: 3 })}
        >
            <Icon name="heading-3" />
        </button>
        <button
            on:click={() => {
                editor.chain().focus().toggleHeading({ level: 4 }).run();
            }}
            class:active={editor?.isActive("heading", { level: 4 })}
        >
            <Icon name="heading-4" />
        </button>
        <button
            on:click={() => {
                editor.chain().focus().toggleBold().run();
            }}
            class:active={editor?.isActive("bold")}
        >
            <Icon name="bold" />
        </button>
        <button
            on:click={() => {
                editor.chain().focus().toggleItalic().run();
            }}
            class:active={editor?.isActive("italic")}
        >
            <Icon name="italic" />
        </button>
        <button
            on:click={() => {
                editor.chain().focus().toggleBulletList().run();
            }}
            class:active={editor?.isActive("bulletList")}
        >
            <Icon name="bullet-list" />
        </button>
        <button
            on:click={() => {
                editor.chain().focus().toggleOrderedList().run();
            }}
            class:active={editor?.isActive("orderedList")}
        >
            <Icon name="ordered-list" />
        </button>
        <div style="border-right: 1px solid #888; height: 28px" />
        <button
            on:click={() => {
                editor.chain().focus().setTextAlign("left").run();
            }}
        >
            <Icon name="align-left" />
        </button>
        <button
            on:click={() => {
                editor.chain().focus().setTextAlign("center").run();
            }}
        >
            <Icon name="align-center" />
        </button>
        <button
            on:click={() => {
                editor.chain().focus().setTextAlign("right").run();
            }}
        >
            <Icon name="align-right" />
        </button>
        <div style="border-right: 1px solid #888; height: 28px" />
        <button
            on:click={() => {
                editor.chain().focus().toggleBlockquote().run();
            }}
        >
            <Icon name="blockquote" />
        </button>
        <button
            on:click={() => {
                editor.chain().focus().toggleCodeBlock().run();
            }}
        >
            <Icon name="code-block" />
        </button>
        <button
            on:click={() => {
                {
                    editor.chain().focus().setHorizontalRule().run();
                }
            }}
        >
            <Icon name="horizontal-rule" />
        </button>

        <button on:click={showUrlModal}><Icon name="link" /></button>
        <button on:click={unsetLink} disabled={!editor?.isActive("link")}>
            <Icon name="unlink" />
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
        <button
            on:click={() =>
                editor
                    .chain()
                    .focus()
                    .insertTable({
                        rows: 3,
                        cols: 3,
                        withHeaderRow: true,
                    })
                    .run()}
        >
            <Icon name="table" />
        </button>
        <button
            on:click={() => {
                editor.chain().focus().setGrid().run();
            }}
        >
            <Icon name="grid" />
        </button>
    </div>
    <div
        bind:this={bubbleTableMenu}
        class="tiptap-controls absolute top-0 flex bubble-menu"
    >
        <button on:click={() => editor.chain().focus().addColumnBefore().run()}>
            <Icon name="tableAddColBefore" />
        </button>
        <button on:click={() => editor.chain().focus().addColumnAfter().run()}
            ><Icon name="tableAddColAfter" /></button
        >
        <button on:click={() => editor.chain().focus().deleteColumn().run()}
            ><Icon name="tableColDelete" /></button
        >
        <button on:click={() => editor.chain().focus().addRowBefore().run()}
            ><Icon name="tableAddRowBefore" /></button
        >
        <button on:click={() => editor.chain().focus().addRowAfter().run()}
            ><Icon name="tableAddRowAfter" /></button
        >
        <button on:click={() => editor.chain().focus().deleteRow().run()}
            ><Icon name="tableRowDelete" /></button
        >
        <button on:click={() => editor.chain().focus().mergeCells().run()}
            ><Icon name="tableMerge" /></button
        >
        <button on:click={() => editor.chain().focus().splitCell().run()}
            ><Icon name="tableSplit" /></button
        >
        <button
            on:click={() => editor.chain().focus().toggleHeaderColumn().run()}
        >
            <Icon name="tableHeaderCol" />
        </button>
        <button on:click={() => editor.chain().focus().toggleHeaderRow().run()}>
            <Icon name="tableHeaderRow" />
        </button>
        <button on:click={() => editor.chain().focus().deleteTable().run()}
            ><Icon name="trash" /></button
        >
    </div>
    <div
        bind:this={bubbleImageMenu}
        class="tiptap-controls absolute top-0 flex bubble-menu"
    >
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
    </div>

    <div bind:this={fixedMenu} class="fixed-controls">
        <button on:click={() => editor?.chain().focus().undo().run()}>
            Undo
        </button>
        <button on:click={() => editor?.chain().focus().redo().run()}>
            Redo
        </button>
    </div>

    <div bind:this={editorElement} class="tiptap-wrapper" {style} />

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
