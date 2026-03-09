import { useEffect, useRef } from 'react';
import type { WindowState } from '../state/useShellStore';

type ResizeDir = 'nw' | 'ne' | 'sw' | 'se';

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
  const resizeStart = useRef<{
    x: number; y: number;
    width: number; height: number;
    originX: number; originY: number;
    dir: ResizeDir;
  } | null>(null);
  const rafId = useRef<number | null>(null);
  const pendingMove = useRef<{ x: number; y: number } | null>(null);
  const pendingResize = useRef<{ width: number; height: number; x?: number; y?: number } | null>(null);

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
      if (frameRef.current) {
        if (pendingMove.current) {
          frameRef.current.style.transform = `translate(${pendingMove.current.x}px, ${pendingMove.current.y}px)`;
        }
        if (pendingResize.current) {
          frameRef.current.style.width = `${pendingResize.current.width}px`;
          frameRef.current.style.height = `${pendingResize.current.height}px`;
          if (pendingResize.current.x != null && pendingResize.current.y != null) {
            frameRef.current.style.transform = `translate(${pendingResize.current.x}px, ${pendingResize.current.y}px)`;
          }
        }
      }
    };

    const queue = () => {
      if (rafId.current !== null) return;
      rafId.current = window.requestAnimationFrame(flush);
    };

    const handleMove = (event: MouseEvent) => {
      if (dragStart.current && frameRef.current) {
        const deltaX = event.clientX - dragStart.current.x;
        const deltaY = event.clientY - dragStart.current.y;
        pendingMove.current = {
          x: dragStart.current.originX + deltaX,
          y: dragStart.current.originY + deltaY,
        };
      }

      if (resizeStart.current) {
        const dX = event.clientX - resizeStart.current.x;
        const dY = event.clientY - resizeStart.current.y;
        const { width: origW, height: origH, originX, originY, dir } = resizeStart.current;

        let newW = origW;
        let newH = origH;
        let newX = originX;
        let newY = originY;

        if (dir === 'se') {
          newW = Math.max(340, origW + dX);
          newH = Math.max(260, origH + dY);
        } else if (dir === 'sw') {
          newW = Math.max(340, origW - dX);
          newH = Math.max(260, origH + dY);
          newX = originX + (origW - newW);
        } else if (dir === 'ne') {
          newW = Math.max(340, origW + dX);
          newH = Math.max(260, origH - dY);
          newY = originY + (origH - newH);
        } else if (dir === 'nw') {
          newW = Math.max(340, origW - dX);
          newH = Math.max(260, origH - dY);
          newX = originX + (origW - newW);
          newY = originY + (origH - newH);
        }

        pendingResize.current = { width: newW, height: newH, x: newX, y: newY };
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
        const { width, height, x, y } = pendingResize.current;
        onResize(frame.id, width, height);
        if (x != null && y != null) {
          onMove(frame.id, x, y);
        }
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

  const handleEdgeMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (frame.maximized) return;
    event.preventDefault();
    event.stopPropagation();
    dragStart.current = {
      x: event.clientX,
      y: event.clientY,
      originX: frame.x,
      originY: frame.y,
    };
    onFocus(frame.id);
  };

  const handleCornerMouseDown = (dir: ResizeDir) => (event: React.MouseEvent<HTMLDivElement>) => {
    if (frame.maximized) return;
    event.preventDefault();
    event.stopPropagation();
    resizeStart.current = {
      x: event.clientX,
      y: event.clientY,
      width: frame.width,
      height: frame.height,
      originX: frame.x,
      originY: frame.y,
      dir,
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
      onMouseDownCapture={() => onFocus(frame.id)}
    >
      {/* Corner resize handles */}
      <div className="window-corner window-corner-nw" onMouseDown={handleCornerMouseDown('nw')} />
      <div className="window-corner window-corner-ne" onMouseDown={handleCornerMouseDown('ne')} />
      <div className="window-corner window-corner-sw" onMouseDown={handleCornerMouseDown('sw')} />
      <div className="window-corner window-corner-se" onMouseDown={handleCornerMouseDown('se')} />

      {/* Edge drag handles (left, right, bottom) */}
      <div className="window-edge window-edge-left" onMouseDown={handleEdgeMouseDown} />
      <div className="window-edge window-edge-right" onMouseDown={handleEdgeMouseDown} />
      <div className="window-edge window-edge-bottom" onMouseDown={handleEdgeMouseDown} />

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
    </section>
  );
}
