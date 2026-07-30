import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import styled from 'styled-components';

const INK = '#1a1a1a';
const RED = '#C41E3A';

/**
 * Minimal rich text editor (bold, italic, bullet/numbered lists) for admin-authored
 * content (legal documents, terms, etc.). Stores/returns HTML via onChange.
 */
const RichTextEditor = ({ content, onChange, placeholder }) => {
  const editor = useEditor({
    extensions: [StarterKit],
    content: content || '',
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  if (!editor) return null;

  return (
    <Wrap>
      <Toolbar>
        <ToolBtn
          type="button"
          $active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          B
        </ToolBtn>
        <ToolBtn
          type="button"
          $active={editor.isActive('italic')}
          $italic
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          i
        </ToolBtn>
        <ToolBtn
          type="button"
          $active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          • List
        </ToolBtn>
        <ToolBtn
          type="button"
          $active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          1. List
        </ToolBtn>
        <ToolBtn
          type="button"
          $active={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          Heading
        </ToolBtn>
      </Toolbar>
      <EditorArea>
        <EditorContent editor={editor} />
        {editor.isEmpty && placeholder && <Placeholder>{placeholder}</Placeholder>}
      </EditorArea>
    </Wrap>
  );
};

export default RichTextEditor;

const Wrap = styled.div`
  border: 1px solid rgba(26,26,26,0.15);
  background: #ffffff;
`;

const Toolbar = styled.div`
  display: flex; gap: 4px; flex-wrap: wrap;
  padding: 6px; border-bottom: 1px solid rgba(26,26,26,0.1);
  background: rgba(26,26,26,0.02);
`;

const ToolBtn = styled.button`
  padding: 5px 10px; border-radius: 0;
  border: 1px solid ${({ $active }) => $active ? RED : 'rgba(26,26,26,0.15)'};
  background: ${({ $active }) => $active ? 'rgba(196,30,58,0.08)' : 'transparent'};
  color: ${({ $active }) => $active ? RED : INK};
  font-family: 'Montserrat', sans-serif;
  font-weight: 700; font-size: 0.78rem;
  font-style: ${({ $italic }) => $italic ? 'italic' : 'normal'};
  cursor: pointer;
  transition: background 0.15s;
  &:hover { background: rgba(26,26,26,0.06); }
`;

const EditorArea = styled.div`
  position: relative;
  padding: 0.8rem;
  min-height: 220px;

  .ProseMirror {
    outline: none;
    font-family: 'Montserrat', sans-serif;
    font-size: 0.9rem;
    color: ${INK};
    line-height: 1.6;
    min-height: 200px;

    p { margin: 0 0 0.7em; }
    h3 { font-family: 'Bebas Neue', sans-serif; letter-spacing: 1px; margin: 0.8em 0 0.3em; }
    ul, ol { padding-left: 1.4em; margin: 0 0 0.7em; }
    strong { font-weight: 800; }
  }
`;

const Placeholder = styled.div`
  position: absolute; top: 0.8rem; left: 0.8rem;
  font-family: 'Montserrat', sans-serif;
  font-size: 0.9rem;
  color: rgba(26,26,26,0.35);
  pointer-events: none;
`;
