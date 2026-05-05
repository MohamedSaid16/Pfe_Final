import React, { useId, useState } from 'react';

/**
 * Tooltip — pure-CSS tooltip with no library dependency.
 *
 * Renders the trigger as-is and shows the label on hover/focus. Positioning
 * is absolute relative to the wrapper, so the trigger should not be a block
 * element that needs to be the layout root.
 *
 * Usage:
 *   <Tooltip label="Total students enrolled this year">
 *     <span tabIndex={0} className="...">12 345</span>
 *   </Tooltip>
 */
export function Tooltip({ label, side = 'top', children, className = '' }) {
  const [visible, setVisible] = useState(false);
  const id = useId();

  if (!label) return children;

  const placement = {
    top:    'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left:   'right-full top-1/2 -translate-y-1/2 mr-2',
    right:  'left-full top-1/2 -translate-y-1/2 ml-2',
  }[side] || 'bottom-full left-1/2 -translate-x-1/2 mb-2';

  return (
    <span
      className={`relative inline-flex ${className}`}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {React.isValidElement(children)
        ? React.cloneElement(children, { 'aria-describedby': id })
        : children}
      <span
        role="tooltip"
        id={id}
        className={`pointer-events-none absolute z-50 ${placement} whitespace-nowrap rounded-md bg-ink px-2 py-1 text-xs font-medium text-surface shadow-md transition-opacity duration-100 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {label}
      </span>
    </span>
  );
}

export default Tooltip;
