import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AnimatedAnswerButtons } from "@/components/invitation/animated-answer-buttons";

describe("AnimatedAnswerButtons", () => {
  it("shows the initial labels and hides the definitive decline", () => {
    render(<AnimatedAnswerButtons onYes={vi.fn()} onDecline={vi.fn()} />);
    expect(screen.getByRole("button", { name: /چرا که نه/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /فعلاً نه/ })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /جدی می‌گم/ }),
    ).not.toBeInTheDocument();
  });

  it("changes the No label and reveals the definitive decline after two No clicks", async () => {
    const user = userEvent.setup();
    render(<AnimatedAnswerButtons onYes={vi.fn()} onDecline={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /فعلاً نه/ }));
    expect(screen.getByRole("button", { name: /مطمئنی/ })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /مطمئنی/ }));
    expect(
      screen.getByRole("button", { name: /قهوه کوچولو/ }),
    ).toBeInTheDocument();
    // Definitive decline now visible.
    expect(screen.getByRole("button", { name: /جدی می‌گم/ })).toBeInTheDocument();
  });

  it("calls onYes with the current No-click count", async () => {
    const onYes = vi.fn();
    const user = userEvent.setup();
    render(<AnimatedAnswerButtons onYes={onYes} onDecline={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /فعلاً نه/ }));
    await user.click(screen.getByRole("button", { name: /مطمئنی/ }));
    // The Yes button is always the first button in the DOM (its label changes).
    await user.click(screen.getAllByRole("button")[0]!);

    expect(onYes).toHaveBeenCalledWith(2);
  });

  it("calls onDecline from the definitive action", async () => {
    const onDecline = vi.fn();
    const user = userEvent.setup();
    render(<AnimatedAnswerButtons onYes={vi.fn()} onDecline={onDecline} />);

    await user.click(screen.getByRole("button", { name: /فعلاً نه/ }));
    await user.click(screen.getByRole("button", { name: /مطمئنی/ }));
    await user.click(screen.getByRole("button", { name: /جدی می‌گم/ }));

    expect(onDecline).toHaveBeenCalledWith(2);
  });
});
