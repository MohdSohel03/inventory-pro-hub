import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Settings from "@/pages/Settings";

// Mock useToast
const mockToast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

describe("Settings - Currency & Language", () => {
  beforeEach(() => {
    localStorage.clear();
    mockToast.mockClear();
  });

  it("renders currency and language selectors", () => {
    render(<Settings />);
    expect(screen.getByText("Currency")).toBeInTheDocument();
    expect(screen.getByText("Language")).toBeInTheDocument();
    expect(screen.getByText("Indian Rupee (₹)")).toBeInTheDocument();
    expect(screen.getByText("English")).toBeInTheDocument();
  });

  it("defaults currency to INR and language to en", () => {
    render(<Settings />);
    expect(localStorage.getItem("app_currency")).toBeNull();
    expect(localStorage.getItem("app_language")).toBeNull();
  });

  it("loads saved currency from localStorage", () => {
    localStorage.setItem("app_currency", "USD");
    render(<Settings />);
    expect(screen.getByText("US Dollar ($)")).toBeInTheDocument();
  });

  it("loads saved language from localStorage", () => {
    localStorage.setItem("app_language", "hi");
    render(<Settings />);
    expect(screen.getByText("Hindi (हिन्दी)")).toBeInTheDocument();
  });
});
