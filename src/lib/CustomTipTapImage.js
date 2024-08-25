import Image from "@tiptap/extension-image";

const CustomTiptapImage = Image.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            srcset: {
                default: null,
            },
            style: {
                default: null,
            },
            class: {
                default: "tiptap-image",
                parseHTML: (element) => {
                    element.getAttribute("class");
                },
            },
            widthClass: {
                default: null,
                parseHTML: (element) =>
                    element.getAttribute("data-width-class"),
                renderHTML: (attributes) => {
                    if (!attributes.widthClass) {
                        return {};
                    }
                    return { "data-width-class": attributes.widthClass };
                },
            },
            floatClass: {
                default: null,
                parseHTML: (element) =>
                    element.getAttribute("data-float-class"),
                renderHTML: (attributes) => {
                    if (!attributes.floatClass) {
                        return {};
                    }
                    return { "data-float-class": attributes.floatClass };
                },
            },
            alignClass: {
                default: null,
                parseHTML: (element) =>
                    element.getAttribute("data-align-class"),
                renderHTML: (attributes) => {
                    if (!attributes.alignClass) {
                        return {};
                    }
                    return { "data-align-class": attributes.alignClass };
                },
            },
        };
    },
    renderHTML({ HTMLAttributes }) {
        const { srcset, class: className, ...attributes } = HTMLAttributes;
        return [
            "img",
            { ...attributes, srcset, class: `tiptap-image ${className}` },
        ];
    },
});

export default CustomTiptapImage;