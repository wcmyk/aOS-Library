import { useEffect, useRef } from 'react';
import type { WindowState } from '../state/useShellStore';

type WindowFrameProps = {
  frame: WindowState;
  onFocus: (id: string) => void;
  onClose: (id: string) => void;
  onMinimize: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  onResize: (id: string, width: number, height: number) => void;
  onToggleMaximize: (id: string) => void;
  children: React.ReactNode;
};

export function WindowFrame({
  frame,
  onClose,
  onMinimize,
  onMove,
  onResize,
  onFocus,
  onToggleMaximize,
  children,
}: WindowFrameProps) {
  const frameRef = useRef<HTMLElement | null>(null);
  const dragStart = useRef<{ x: number; y: number; originX: number; originY: number } | null>(null);
  const resizeStart = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  const rafId = useRef<number | null>(null);
  const pendingMove = useRef<{ x: number; y: number } | null>(null);
  const pendingResize = useRef<{ width: number; height: number } | null>(null);

  useEffect(() => {
    const node = frameRef.current;
    if (!node) return;
    node.style.transform = `translate(${frame.x}px, ${frame.y}px)`;
    node.style.width = `${frame.width}px`;
    node.style.height = `${frame.height}px`;
  }, [frame.height, frame.width, frame.x, frame.y]);

  useEffect(() => {
    const flush = () => {
      rafId.current = null;
      if (pendingMove.current && frameRef.current) {
        frameRef.current.style.transform = `translate(${pendingMove.current.x}px, ${pendingMove.current.y}px)`;
      }
      if (pendingResize.current && frameRef.current) {
        frameRef.current.style.width = `${pendingResize.current.width}px`;
        frameRef.current.style.height = `${pendingResize.current.height}px`;
      }
    };

    const queue = () => {
      if (rafId.current !== null) return;
      rafId.current = window.requestAnimationFrame(flush);
    };

    const handleMove = (event: MouseEvent) => {
      if (dragStart.current) {
        const deltaX = event.clientX - dragStart.current.x;
        const deltaY = event.clientY - dragStart.current.y;
        pendingMove.current = {
          x: dragStart.current.originX + deltaX,
          y: dragStart.current.originY + deltaY,
        };
      }

      if (resizeStart.current) {
        const deltaX = event.clientX - resizeStart.current.x;
        const deltaY = event.clientY - resizeStart.current.y;
        pendingResize.current = {
          width: Math.max(340, resizeStart.current.width + deltaX),
          height: Math.max(260, resizeStart.current.height + deltaY),
        };
      }

      if (dragStart.current || resizeStart.current) queue();
    };

    const handleUp = () => {
      dragStart.current = null;
      resizeStart.current = null;

      if (rafId.current !== null) {
        window.cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }

      if (pendingMove.current) {
        onMove(frame.id, pendingMove.current.x, pendingMove.current.y);
        pendingMove.current = null;
      }

      if (pendingResize.current) {
        onResize(frame.id, pendingResize.current.width, pendingResize.current.height);
        pendingResize.current = null;
      }
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
    if (frame.maximized) return;
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
    if (frame.maximized) return;
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
      ref={frameRef}
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
          <button
            className="light green"
            aria-label={frame.maximized ? 'Restore window size' : 'Maximize window'}
            onClick={() => onToggleMaximize(frame.id)}
            type="button"
          />
        </div>
        <span className="window-title">{frame.title}</span>
      </div>
      <div className="window-body">{children}</div>
      <div className="window-resizer" onMouseDown={handleResizeDown} />
    </section>
  );
}
