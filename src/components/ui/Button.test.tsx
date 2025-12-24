import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Button } from './Button';

describe('Button Component', () => {
  it('should render text correctly', () => {
    render(<Button>Click here</Button>);

    const button = screen.getByRole('button', { name: /click here/i });
    expect(button).toBeInTheDocument();
  });

  it('should apply primary variant class by default', () => {
    render(<Button>Primary</Button>);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-accent');
  });
});