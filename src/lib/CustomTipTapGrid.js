import { Node, mergeAttributes } from '@tiptap/core'
import { nodeInputRule } from '@tiptap/core'

export const Grid = Node.create({
  name: 'grid',

  group: 'block',

  content: 'block+',

  defining: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[class=grid]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes({ class: 'grid' }, this.options.HTMLAttributes, HTMLAttributes), 0]
  },  

  addCommands() {
    return {
      setGrid: () => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          content: [{ type: 'paragraph' }],
        })
      },
    }
  },
  

  addInputRules() {
    return [
      nodeInputRule({
        find: /^\/grid$/,
        type: this.name,
      }),
    ]
  },
})
