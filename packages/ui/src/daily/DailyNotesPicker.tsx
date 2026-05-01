import * as React from "react";
import { useState } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../lib/utils";

export interface DailyNotesPickerProps {
  /** Called with the ISO date string (YYYY-MM-DD) the user selects */
  onSelectDate: (isoDate: string) => void;
  /** Highlighted dates that have an existing daily note */
  existingDates?: string[];
  /** Currently selected date (ISO YYYY-MM-DD) */
  selectedDate?: string | null;
  className?: string;
}

function toIso(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/**
 * A compact calendar date-picker for daily notes.
 * Pure UI: receives existing note dates as strings and fires onSelectDate.
 */
export function DailyNotesPicker({
  onSelectDate,
  existingDates = [],
  selectedDate,
  className,
}: DailyNotesPickerProps) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDow = getFirstDayOfWeek(viewYear, viewMonth);
  const existingSet = new Set(existingDates);
  const todayIso = toIso(today.getFullYear(), today.getMonth(), today.getDate());

  const prevMonth = () => {
    setViewMonth((m) => {
      if (m === 0) { setViewYear((y) => y - 1); return 11; }
      return m - 1;
    });
  };

  const nextMonth = () => {
    setViewMonth((m) => {
      if (m === 11) { setViewYear((y) => y + 1); return 0; }
      return m + 1;
    });
  };

  const cells: (number | null)[] = [
    ...Array<null>(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className={cn("select-none", className)}>
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-2 px-1">
        <button
          type="button"
          onClick={prevMonth}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft size={14} className="text-gray-500" />
        </button>
        <button
          type="button"
          onClick={() => {
            setViewYear(today.getFullYear());
            setViewMonth(today.getMonth());
          }}
          className="text-xs font-semibold text-gray-700 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
        >
          {MONTH_NAMES[viewMonth]} {viewYear}
        </button>
        <button
          type="button"
          onClick={nextMonth}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Next month"
        >
          <ChevronRight size={14} className="text-gray-500" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="text-center text-[10px] font-medium text-gray-400 dark:text-gray-500 py-0.5"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} />;
          const iso = toIso(viewYear, viewMonth, day);
          const isToday = iso === todayIso;
          const isSelected = iso === selectedDate;
          const hasNote = existingSet.has(iso);

          return (
            <button
              key={iso}
              type="button"
              onClick={() => onSelectDate(iso)}
              className={cn(
                "relative w-full aspect-square flex items-center justify-center text-xs rounded transition-colors",
                isSelected
                  ? "bg-violet-600 text-white font-semibold"
                  : isToday
                    ? "bg-violet-500/10 text-violet-600 dark:text-violet-400 font-semibold"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800",
              )}
              aria-label={iso}
              aria-current={isToday ? "date" : undefined}
              aria-pressed={isSelected}
            >
              {day}
              {hasNote && !isSelected && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-violet-500" />
              )}
            </button>
          );
        })}
      </div>

      {/* Today shortcut */}
      <div className="mt-2 flex justify-center">
        <button
          type="button"
          onClick={() => onSelectDate(todayIso)}
          className="flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400 hover:underline"
        >
          <Calendar size={12} />
          Today
        </button>
      </div>
    </div>
  );
}
