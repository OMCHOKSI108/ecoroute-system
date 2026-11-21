import { ReactNode } from 'react';

interface FilterPanelProps {
  children: ReactNode;
}

export function FilterPanel({ children }: FilterPanelProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-white p-4">
      {children}
    </div>
  );
}
