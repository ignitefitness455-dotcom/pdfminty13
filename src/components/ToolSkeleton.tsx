import React from 'react';

export default function ToolSkeleton() {
  return (
    <div className="animate-pulse max-w-4xl mx-auto p-6 space-y-6">
      <div className="h-4 w-24 bg-surface-container-high rounded-lg"></div>
      <div className="h-8 w-1/3 bg-surface-container-high rounded-xl"></div>
      <div className="h-4 w-1/2 bg-surface-container-low rounded-lg"></div>
      <div className="h-64 bg-surface-container-low rounded-[24px] border border-border-muted"></div>
      <div className="h-12 w-1/3 bg-surface-container-high rounded-xl"></div>
    </div>
  );
}
