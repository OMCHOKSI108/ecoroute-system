interface MapPlaceholderProps {
  height?: string;
}

export function MapPlaceholder({ height = '400px' }: MapPlaceholderProps) {
  return (
    <div
      className="flex items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-400"
      style={{ height }}
    >
      Map view — map library not yet integrated
    </div>
  );
}
