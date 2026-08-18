import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortableItem = ({ id, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    position: 'relative',
    zIndex: isDragging ? 1 : 'auto',
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      {/* touchAction: 'none' stops the browser's own scroll gesture from
          fighting the drag on touch devices — without it, the page scrolls
          along with the drag and everything flashes/jumps. */}
      <div {...listeners} style={{ cursor: 'grab', paddingRight: '0.5rem', touchAction: 'none' }}>⠿</div>

      <div style={{ flex: 1 }}>
        {children}
      </div>
    </div>
  );
};

export default SortableItem;
