import { useEffect, useRef } from 'react';
import type { WindowState } from '../state/useShellStore';

type WindowFrameProps = {
  frame: WindowState;
  onFocus: (id: string) => void;
  onClose: (id: string) => void;
  onMinimize: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  onResize: (id: string, width: number, height: number) => void;
  children: React.ReactNode;
};

export function WindowFrame({ frame, onClose, onMinimize, onMove, onResize, onFocus, children }: WindowFrameProps) {
  const dragStart = useRef<{ x: number; y: number; originX: number; originY: number } | null>(null);
  const resizeStart = useRef<{ x: number; y: number; width: number; height: number } | null>(null);

  useEffect(() => {
    const handleMove = (event: MouseEvent) => {
      if (dragStart.current) {
        const deltaX = event.clientX - dragStart.current.x;
        const deltaY = event.clientY - dragStart.current.y;
        onMove(frame.id, dragStart.current.originX + deltaX, dragStart.current.originY + deltaY);
      }
      if (resizeStart.current) {
        const deltaX = event.clientX - resizeStart.current.x;
        const deltaY = event.clientY - resizeStart.current.y;
        onResize(frame.id, resizeStart.current.width + deltaX, resizeStart.current.height + deltaY);
      }
    };

    const handleUp = () => {
      dragStart.current = null;
      resizeStart.current = null;
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [frame.id, onMove, onResize]);

  const handleHeaderMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragStart.current = {
      x: event.clientX,
      y: event.clientY,
      originX: frame.x,
      originY: frame.y,
    };
    onFocus(frame.id);
  };

  const handleResizeDown = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    resizeStart.current = {
      x: event.clientX,
      y: event.clientY,
      width: frame.width,
      height: frame.height,
    };
    onFocus(frame.id);
  };

  return (
    <section
      className="window"
      style={{
        width: frame.width,
        height: frame.height,
        transform: `translate(${frame.x}px, ${frame.y}px)`,
        zIndex: frame.zIndex,
      }}
      onMouseDown={() => onFocus(frame.id)}
    >
      <div className="window-header" onMouseDown={handleHeaderMouseDown}>
        <div className="traffic-lights">
          <button className="light red" onClick={() => onClose(frame.id)} aria-label="Close window" type="button" />
          <button
            className="light yellow"
            onClick={() => onMinimize(frame.id)}
            aria-label="Minimize window"
            type="button"
          />
          <span className="light green" aria-hidden />
        </div>
        <span className="window-title">{frame.title}</span>
      </div>
      <div className="window-body">{children}</div>
      <div className="window-resizer" onMouseDown={handleResizeDown} />
    </section>
  );
}
