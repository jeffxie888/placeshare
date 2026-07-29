"use client";

// Select all / Clear / count, shared by the single-list and comparison
// views so the two panels behave identically.
export default function SelectionToolbar({
  total,
  selectedCount,
  allSelected,
  onSelectAll,
  onClear,
}: {
  total: number;
  selectedCount: number;
  allSelected: boolean;
  onSelectAll: () => void;
  onClear: () => void;
}) {
  const buttonClass =
    "rounded-full px-3.5 py-1.5 text-xs font-semibold text-ink ring-1 ring-line transition hover:bg-surface disabled:opacity-40 disabled:hover:bg-transparent";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={onSelectAll}
        disabled={total === 0 || allSelected}
        className={buttonClass}
      >
        Select all
      </button>
      <button onClick={onClear} disabled={selectedCount === 0} className={buttonClass}>
        Clear
      </button>
      <span className="text-xs text-muted">
        {selectedCount > 0
          ? `${selectedCount} selected · map framed to fit`
          : `${total} ${total === 1 ? "place" : "places"}`}
      </span>
    </div>
  );
}
