import { render, screen } from "@testing-library/react";
import App from "../App";

describe("App", () => {
  it("renders the voice agent view", () => {
    render(<App />);
    expect(screen.getByText("Roxanne")).toBeInTheDocument();
    expect(screen.getByText("Start Call")).toBeInTheDocument();
  });
});
