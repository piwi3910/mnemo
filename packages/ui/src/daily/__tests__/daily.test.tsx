import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DailyNotesPicker } from "../DailyNotesPicker";
import { DailyNoteShell } from "../DailyNoteShell";

describe("DailyNotesPicker", () => {
  it("renders weekday headers", () => {
    render(<DailyNotesPicker onSelectDate={vi.fn()} />);
    expect(screen.getByText("Su")).toBeInTheDocument();
    expect(screen.getByText("Mo")).toBeInTheDocument();
    expect(screen.getByText("Sa")).toBeInTheDocument();
  });

  it("renders the current month name", () => {
    render(<DailyNotesPicker onSelectDate={vi.fn()} />);
    const today = new Date();
    const monthName = today.toLocaleString("en-US", { month: "long" });
    expect(screen.getByText(new RegExp(monthName))).toBeInTheDocument();
  });

  it("calls onSelectDate with correct ISO string on day click", () => {
    const onSelectDate = vi.fn();
    render(<DailyNotesPicker onSelectDate={onSelectDate} />);
    // Click day "1" (first day button with label starting with current year/month)
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const dayButton = screen.getByRole("button", { name: `${year}-${month}-01` });
    fireEvent.click(dayButton);
    expect(onSelectDate).toHaveBeenCalledWith(`${year}-${month}-01`);
  });

  it("navigates to previous month on left arrow click", () => {
    render(<DailyNotesPicker onSelectDate={vi.fn()} />);
    const today = new Date();
    // Click prev
    fireEvent.click(screen.getByRole("button", { name: /previous month/i }));
    const prevDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const prevMonthName = prevDate.toLocaleString("en-US", { month: "long" });
    expect(screen.getByText(new RegExp(prevMonthName))).toBeInTheDocument();
  });

  it("navigates to next month on right arrow click", () => {
    render(<DailyNotesPicker onSelectDate={vi.fn()} />);
    const today = new Date();
    fireEvent.click(screen.getByRole("button", { name: /next month/i }));
    const nextDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const nextMonthName = nextDate.toLocaleString("en-US", { month: "long" });
    expect(screen.getByText(new RegExp(nextMonthName))).toBeInTheDocument();
  });

  it("marks selected date with aria-pressed", () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const iso = `${year}-${month}-01`;
    render(<DailyNotesPicker onSelectDate={vi.fn()} selectedDate={iso} />);
    const btn = screen.getByRole("button", { name: iso });
    expect(btn).toHaveAttribute("aria-pressed", "true");
  });

  it("Today button calls onSelectDate with today's ISO date", () => {
    const onSelectDate = vi.fn();
    render(<DailyNotesPicker onSelectDate={onSelectDate} />);
    fireEvent.click(screen.getByRole("button", { name: /today/i }));
    const today = new Date();
    const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    expect(onSelectDate).toHaveBeenCalledWith(iso);
  });
});

describe("DailyNoteShell", () => {
  it("renders formatted date in header", () => {
    render(<DailyNoteShell date="2026-04-30" />);
    // April 30 2026 should appear in some form
    expect(screen.getByText(/april/i)).toBeInTheDocument();
    expect(screen.getByText(/30/)).toBeInTheDocument();
  });

  it("renders children", () => {
    render(
      <DailyNoteShell date="2026-04-30">
        <div>Editor content</div>
      </DailyNoteShell>,
    );
    expect(screen.getByText("Editor content")).toBeInTheDocument();
  });

  it("renders headerActions", () => {
    render(
      <DailyNoteShell
        date="2026-04-30"
        headerActions={<button>Prev</button>}
      />,
    );
    expect(screen.getByRole("button", { name: "Prev" })).toBeInTheDocument();
  });
});
