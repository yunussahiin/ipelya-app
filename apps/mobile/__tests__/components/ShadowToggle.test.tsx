/**
 * ShadowToggle Component Tests
 * Tests for shadow mode toggle button component
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";
import { ShadowToggle } from "@/components/shadow/ShadowToggle";
import { useShadowMode } from "@/hooks/useShadowMode";

// Mock the hook
jest.mock("@/hooks/useShadowMode");

describe("ShadowToggle Component", () => {
  const mockToggleShadowMode = jest.fn();
  const mockVerifyBiometric = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useShadowMode as jest.Mock).mockReturnValue({
      enabled: false,
      loading: false,
      error: null,
      toggleShadowMode: mockToggleShadowMode,
      verifyBiometric: mockVerifyBiometric
    });
  });

  it("should render toggle button", () => {
    render(<ShadowToggle />);
    const button = screen.getByTestId("shadow-toggle-button");
    expect(button).toBeDefined();
  });

  it("should show correct text when shadow mode is disabled", () => {
    render(<ShadowToggle />);
    const text = screen.getByText(/Gölge Mode Aç/i);
    expect(text).toBeDefined();
  });

  it("should show correct text when shadow mode is enabled", () => {
    (useShadowMode as jest.Mock).mockReturnValue({
      enabled: true,
      loading: false,
      error: null,
      toggleShadowMode: mockToggleShadowMode,
      verifyBiometric: mockVerifyBiometric
    });

    render(<ShadowToggle />);
    const text = screen.getByText(/Gölge Mode Kapat/i);
    expect(text).toBeDefined();
  });

  it("should call toggleShadowMode on button press", async () => {
    render(<ShadowToggle />);
    const button = screen.getByTestId("shadow-toggle-button");

    fireEvent.press(button);

    await waitFor(() => {
      expect(mockToggleShadowMode).toHaveBeenCalled();
    });
  });

  it("should show loading state", () => {
    (useShadowMode as jest.Mock).mockReturnValue({
      enabled: false,
      loading: true,
      error: null,
      toggleShadowMode: mockToggleShadowMode,
      verifyBiometric: mockVerifyBiometric
    });

    render(<ShadowToggle />);
    const button = screen.getByTestId("shadow-toggle-button");
    expect(button.props.disabled).toBe(true);
  });

  it("should display error message", () => {
    const errorMessage = "PIN doğru değil";
    (useShadowMode as jest.Mock).mockReturnValue({
      enabled: false,
      loading: false,
      error: errorMessage,
      toggleShadowMode: mockToggleShadowMode,
      verifyBiometric: mockVerifyBiometric
    });

    render(<ShadowToggle />);
    const error = screen.getByText(errorMessage);
    expect(error).toBeDefined();
  });

  it("should try biometric first", async () => {
    mockVerifyBiometric.mockResolvedValue(true);

    render(<ShadowToggle />);
    const button = screen.getByTestId("shadow-toggle-button");

    fireEvent.press(button);

    await waitFor(() => {
      expect(mockVerifyBiometric).toHaveBeenCalled();
    });
  });

  it("should fallback to PIN if biometric fails", async () => {
    mockVerifyBiometric.mockResolvedValue(false);

    render(<ShadowToggle />);
    const button = screen.getByTestId("shadow-toggle-button");

    fireEvent.press(button);

    await waitFor(() => {
      expect(mockVerifyBiometric).toHaveBeenCalled();
      // PIN modal should be shown
    });
  });
});
