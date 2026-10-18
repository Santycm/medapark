import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import NumberStepper from './NumberStepper';

const Harness = ({ initial = '5', min = 0, max = 9999 }: { initial?: string; min?: number; max?: number }) => {
  const [value, setValue] = useState(initial);
  return <NumberStepper value={value} onChange={setValue} label="Capacidad" min={min} max={max} />;
};

describe('NumberStepper', () => {
  it('suma y resta uno', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: 'Aumentar Capacidad' }));
    expect(screen.getByLabelText('Capacidad')).toHaveValue('6');
    await user.click(screen.getByRole('button', { name: 'Disminuir Capacidad' }));
    await user.click(screen.getByRole('button', { name: 'Disminuir Capacidad' }));
    expect(screen.getByLabelText('Capacidad')).toHaveValue('4');
  });

  it('deshabilita "−" en el mínimo y "+" en el máximo', () => {
    const { rerender } = render(<Harness initial="0" />);
    expect(screen.getByRole('button', { name: 'Disminuir Capacidad' })).toBeDisabled();
    rerender(<Harness initial="0" max={0} />);
    expect(screen.getByRole('button', { name: 'Aumentar Capacidad' })).toBeDisabled();
  });

  it('solo acepta dígitos y respeta el máximo', async () => {
    const user = userEvent.setup();
    render(<Harness initial="" max={9999} />);
    const input = screen.getByLabelText('Capacidad');
    await user.type(input, 'a1b2c3');
    expect(input).toHaveValue('123');
    await user.clear(input);
    await user.type(input, '99999');
    expect(input).toHaveValue('9999');
  });

  it('permite dejar el campo vacío', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.clear(screen.getByLabelText('Capacidad'));
    expect(screen.getByLabelText('Capacidad')).toHaveValue('');
  });
});
