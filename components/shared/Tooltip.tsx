import React, { useState } from 'react';
import { cn } from '../../utils/cn';

interface TooltipProps {
  children: React.ReactNode;
}

export const TooltipProvider: React.FC<TooltipProps & { className?: string }> = ({ children, className }) => {
  return <div className={cn("relative group/tooltip-provider", className)}>{children}</div>;
};

export const Tooltip: React.FC<TooltipProps> = ({ children }) => {
  return <>{children}</>;
};

export const TooltipTrigger: React.FC<{ asChild?: boolean; children: React.ReactNode; className?: string }> = ({ children, className }) => {
  return <div className={className}>{children}</div>;
};

export const TooltipContent: React.FC<{ children: React.ReactNode; side?: 'top' | 'bottom' | 'left' | 'right'; className?: string }> = ({ children, side = 'top', className }) => {
  const sideClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div className={cn(
      "absolute z-50 px-2 py-1 text-[10px] font-bold text-white bg-slate-900 rounded shadow-lg whitespace-nowrap opacity-0 pointer-events-none group-hover/tooltip-provider:opacity-100 transition-opacity",
      sideClasses[side],
      className
    )}>
      {children}
      <div className={cn(
        "absolute w-2 h-2 bg-slate-900 rotate-45",
        side === 'top' && "left-1/2 -translate-x-1/2 -bottom-1",
        side === 'bottom' && "left-1/2 -translate-x-1/2 -top-1",
        side === 'left' && "top-1/2 -translate-y-1/2 -right-1",
        side === 'right' && "top-1/2 -translate-y-1/2 -left-1",
      )} />
    </div>
  );
};
