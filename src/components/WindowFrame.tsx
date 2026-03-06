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
  const rafId = useRef<number | null>(null);
  const pendingMove = useRef<{ x: number; y: number } | null>(null);
  const pendingResize = useRef<{ width: number; height: number } | null>(null);

  useEffect(() => {
    const flushPointerUpdates = () => {
      rafId.current = null;
      if (pendingMove.current) {
        onMove(frame.id, pendingMove.current.x, pendingMove.current.y);
        pendingMove.current = null;
      }
      if (pendingResize.current) {
        onResize(frame.id, pendingResize.current.width, pendingResize.current.height);
        pendingResize.current = null;
      }
    };

    const queueFrame = () => {
      if (rafId.current !== null) return;
      rafId.current = window.requestAnimationFrame(flushPointerUpdates);
    };

    const handleMove = (event: MouseEvent) => {
      if (dragStart.current) {
        const deltaX = event.clientX - dragStart.current.x;
        const deltaY = event.clientY - dragStart.current.y;
        pendingMove.current = {
          x: dragStart.current.originX + deltaX,
          y: dragStart.current.originY + deltaY,
        };
        queueFrame();
      }

      if (resizeStart.current) {
        const deltaX = event.clientX - resizeStart.current.x;
        const deltaY = event.clientY - resizeStart.current.y;
        pendingResize.current = {
          width: resizeStart.current.width + deltaX,
          height: resizeStart.current.height + deltaY,
        };
        queueFrame();
      }
    };

    const handleUp = () => {
      dragStart.current = null;
      resizeStart.current = null;
      if (rafId.current !== null) {
        window.cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
      flushPointerUpdates();
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      if (rafId.current !== null) {
        window.cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
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
