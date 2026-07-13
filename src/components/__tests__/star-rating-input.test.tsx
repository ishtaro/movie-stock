import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { StarRatingInput } from "@/components/star-rating-input";
import { Stars } from "@/components/stars";

function hiddenValue(container: HTMLElement): string {
  return (
    container.querySelector<HTMLInputElement>('input[name="rating"]')?.value ??
    ""
  );
}

describe("StarRatingInput（DESIGN.md S-5: タップで設定・再タップで解除）", () => {
  it("初期状態は未評価（hidden input は空）", () => {
    const { container } = render(<StarRatingInput name="rating" />);
    expect(hiddenValue(container)).toBe("");
    expect(screen.getByText("未評価")).toBeTruthy();
  });

  it("星4をタップすると評価4になる", async () => {
    const user = userEvent.setup();
    const { container } = render(<StarRatingInput name="rating" />);
    await user.click(screen.getByRole("button", { name: /星4/ }));
    expect(hiddenValue(container)).toBe("4");
  });

  it("同じ星の再タップで未評価に戻る", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <StarRatingInput name="rating" defaultValue={4} />,
    );
    expect(hiddenValue(container)).toBe("4");
    await user.click(screen.getByRole("button", { name: /星4/ }));
    expect(hiddenValue(container)).toBe("");
    expect(screen.getByText("未評価")).toBeTruthy();
  });

  it("編集時は既存の評価を初期表示する", () => {
    const { container } = render(
      <StarRatingInput name="rating" defaultValue={3} />,
    );
    expect(hiddenValue(container)).toBe("3");
  });
});

describe("Stars（表示用。未評価と星0を混同しない）", () => {
  it("null は「未評価」と表示する", () => {
    render(<Stars rating={null} />);
    expect(screen.getByText("未評価")).toBeTruthy();
  });

  it("評価ありは aria-label で読み上げできる", () => {
    render(<Stars rating={4} />);
    expect(screen.getByLabelText("評価 4 / 5")).toBeTruthy();
  });
});
