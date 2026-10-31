// Punto de entrada del editor. Se empaqueta en vendor/editor.js con esbuild (ver package.json).
export { Editor } from '@tiptap/core';
export { default as StarterKit } from '@tiptap/starter-kit';
export { TaskList, TaskItem } from '@tiptap/extension-list';
export { Placeholder } from '@tiptap/extensions';
export { Markdown } from '@tiptap/markdown';
