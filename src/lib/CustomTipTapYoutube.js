import { mergeAttributes } from '@tiptap/core';
import Youtube from '@tiptap/extension-youtube';

const CustomTiptapYoutube = Youtube.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      widthClass: {
        default: null,
        parseHTML: element => element.getAttribute('data-width-class') || null,
        renderHTML: attributes => {
          return { 'data-width-class': attributes.widthClass };
        },
      },
      floatClass: {
        default: null,
        parseHTML: element => element.getAttribute('data-float-class') || null,
        renderHTML: attributes => {
          return { 'data-float-class': attributes.floatClass };
        },
      },
      alignClass: {
        default: null,
        parseHTML: element => element.getAttribute('data-align-class') || null,
        renderHTML: attributes => {
          return { 'data-align-class': attributes.alignClass };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-youtube-video]',
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const { widthClass, floatClass, alignClass, ...rest } = HTMLAttributes;
    return [
      'div',
      mergeAttributes(
        {
          'data-youtube-video': '',
          'data-width-class': widthClass,
          'data-float-class': floatClass,
          'data-align-class': alignClass,
        },
        rest
      ),
      [
        'iframe',
        {
          src: node.attrs.src,
          width: node.attrs.width,
          height: node.attrs.height,
          allowfullscreen: node.attrs.allowfullscreen,
          autoplay: node.attrs.autoplay,
          disablekb: node.attrs.disablekb,
          enablejsapi: node.attrs.enablejsapi,
          start: node.attrs.start,
          end: node.attrs.end,
          modestbranding: node.attrs.modestbranding,
        },
      ],
    ];
  },

  addCommands() {
    return {
      setYoutubeVideo: options => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
        });
      },
    };
  },
});

export default CustomTiptapYoutube;