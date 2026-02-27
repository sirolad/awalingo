import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import NeoLanguage from '../NeoLanguage';
import { setMyTargetLanguage } from '@/actions/language';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

// Mock dependencies
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

vi.mock('@/actions/language', () => ({
  setMyTargetLanguage: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('NeoLanguage Component', () => {
  const mockRouter = {
    push: vi.fn(),
    back: vi.fn(),
  };

  const mockLanguages = [
    { id: 1, name: 'Yoruba', icon: 'NG' },
    { id: 2, name: 'Igbo', icon: null },
    { id: 3, name: 'Hausa', icon: null },
  ];

  beforeEach(() => {
    (useRouter as ReturnType<typeof vi.fn>).mockReturnValue(mockRouter);
    // Default success response
    (setMyTargetLanguage as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
    });
    vi.clearAllMocks();
  });

  it('renders correctly with provided languages', () => {
    render(<NeoLanguage languages={mockLanguages} initialSelectedId={null} />);

    expect(
      screen.getByText('Choose Your Awalingo Community')
    ).toBeInTheDocument();
    expect(screen.getByText('Yoruba')).toBeInTheDocument();
    expect(screen.getByText('Igbo')).toBeInTheDocument();
    expect(screen.getByText('Hausa')).toBeInTheDocument();
  });

  it('initializes with provided initialSelectedId', async () => {
    render(<NeoLanguage languages={mockLanguages} initialSelectedId={2} />);

    // Check if the radio button for Igbo is selected (or has the visual indicator)
    // The component uses conditional rendering for the selected state indicator
    const igboButton = screen.getByText('Igbo').closest('button');
    // We can check if the visual indicator div exists inside the button
    // The selected indicator is a div with bg-[#111111]
    // But testing by class name is brittle.
    // The component sets border-[#111111] on the radio circle when selected.

    // Let's check if the button itself has the selected class style if possible,
    // or just assume if we can select it, it works.
    // The component logic: selectedNeoLanguage === language.id

    // Simpler check: Clicking next without selection should work if initially selected
    const nextButton = screen.getByText('Complete Profile');
    fireEvent.click(nextButton);

    expect(setMyTargetLanguage).toHaveBeenCalledWith(2);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Neo Community set to Igbo');
      expect(mockRouter.push).toHaveBeenCalledWith('/home');
    });
  });

  it('allows selecting a language', async () => {
    render(<NeoLanguage languages={mockLanguages} initialSelectedId={null} />);

    const yorubaButton = screen.getByText('Yoruba');
    fireEvent.click(yorubaButton);

    const nextButton = screen.getByText('Complete Profile');
    fireEvent.click(nextButton);

    expect(setMyTargetLanguage).toHaveBeenCalledWith(1);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Neo Community set to Yoruba');
      expect(mockRouter.push).toHaveBeenCalledWith('/home');
    });
  });

  it('shows error if no language selected', () => {
    render(<NeoLanguage languages={mockLanguages} initialSelectedId={null} />);

    const nextButton = screen.getByText('Complete Profile');
    fireEvent.click(nextButton);

    expect(toast.error).toHaveBeenCalledWith(
      'Please select a Neo Community to proceed.'
    );
    expect(setMyTargetLanguage).not.toHaveBeenCalled();
  });

  it('handles successful submission', async () => {
    (setMyTargetLanguage as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
    });

    render(<NeoLanguage languages={mockLanguages} initialSelectedId={1} />);

    const nextButton = screen.getByText('Complete Profile');
    fireEvent.click(nextButton);

    expect(setMyTargetLanguage).toHaveBeenCalledWith(1);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Neo Community set to Yoruba');
      expect(mockRouter.push).toHaveBeenCalledWith('/home');
    });
  });

  it('handles submission error', async () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    (setMyTargetLanguage as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Failed')
    );

    render(<NeoLanguage languages={mockLanguages} initialSelectedId={1} />);

    const nextButton = screen.getByText('Complete Profile');
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'An error occurred while setting Neo Community.'
      );
    });
    expect(mockRouter.push).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('navigates back when back button is clicked', () => {
    render(<NeoLanguage languages={mockLanguages} initialSelectedId={null} />);

    // The back button is an SVG inside a button
    // It's the first button in the component or we can find by svg content
    const buttons = screen.getAllByRole('button');
    const backButton = buttons[0]; // Assuming it's the first one as it is at the top

    fireEvent.click(backButton);

    expect(mockRouter.back).toHaveBeenCalled();
  });
});
