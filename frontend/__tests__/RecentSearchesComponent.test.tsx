import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import RecentSearches from "../components/RecentSearches";

describe("RecentSearches Component", () => {
  const mockOnSelect = jest.fn();
  const mockOnRemove = jest.fn();
  const mockOnClear = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders nothing when searches array is empty", () => {
    const { container } = render(
      <RecentSearches
        searches={[]}
        onSelect={mockOnSelect}
        onRemove={mockOnRemove}
        onClear={mockOnClear}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders chips for each recent username with @ prefix", () => {
    render(
      <RecentSearches
        searches={["torvalds", "gaearon", "kentcdodds"]}
        onSelect={mockOnSelect}
        onRemove={mockOnRemove}
        onClear={mockOnClear}
      />
    );

    expect(screen.getByText("Recent:")).toBeInTheDocument();
    expect(screen.getByText("@torvalds")).toBeInTheDocument();
    expect(screen.getByText("@gaearon")).toBeInTheDocument();
    expect(screen.getByText("@kentcdodds")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Clear all/i })).toBeInTheDocument();
  });

  it("triggers onSelect callback when clicking a username chip", () => {
    render(
      <RecentSearches
        searches={["torvalds", "gaearon"]}
        onSelect={mockOnSelect}
        onRemove={mockOnRemove}
        onClear={mockOnClear}
      />
    );

    const torvaldsChip = screen.getByRole("button", {
      name: /Re-run analysis for GitHub user @torvalds/i,
    });
    fireEvent.click(torvaldsChip);

    expect(mockOnSelect).toHaveBeenCalledWith("torvalds");
    expect(mockOnRemove).not.toHaveBeenCalled();
  });

  it("triggers onRemove callback when clicking the chip remove button", () => {
    render(
      <RecentSearches
        searches={["torvalds", "gaearon"]}
        onSelect={mockOnSelect}
        onRemove={mockOnRemove}
        onClear={mockOnClear}
      />
    );

    const removeBtn = screen.getByRole("button", {
      name: /Remove @torvalds from recent searches/i,
    });
    fireEvent.click(removeBtn);

    expect(mockOnRemove).toHaveBeenCalledWith("torvalds");
    expect(mockOnSelect).not.toHaveBeenCalled();
  });

  it("triggers onClear callback when clicking Clear all", () => {
    render(
      <RecentSearches
        searches={["torvalds", "gaearon"]}
        onSelect={mockOnSelect}
        onRemove={mockOnRemove}
        onClear={mockOnClear}
      />
    );

    const clearBtn = screen.getByRole("button", { name: /Clear all/i });
    fireEvent.click(clearBtn);

    expect(mockOnClear).toHaveBeenCalledTimes(1);
  });
});
