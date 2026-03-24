interface StatusBarProps {
  notePath: string | null;
  line: number;
  col: number;
  wordCount: number;
}

export function StatusBar({ notePath, line, col, wordCount }: StatusBarProps) {
  return (
    <div className="h-6 flex-shrink-0 flex items-center justify-between px-3 border-t border-gray-700/50 bg-surface-900 text-xs font-mono select-none">
      <div className="text-gray-400 truncate max-w-[40%]">
        {notePath || 'No file'}
      </div>
      <div className="flex items-center gap-3 text-gray-400">
        <span>{line}:{col}</span>
        <span>{wordCount.toLocaleString()} words</span>
      </div>
    </div>
  );
}
