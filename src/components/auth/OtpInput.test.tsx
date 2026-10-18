import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import OtpInput from './OtpInput';

const Harness = ({ onComplete }: { onComplete?: (v: string) => void }) => {
  const [value, setValue] = useState('');
  return <OtpInput value={value} onChange={setValue} onComplete={onComplete} />;
};

describe('OtpInput', () => {
  it('solo acepta dígitos y máximo 6', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const input = screen.getByLabelText('Código de verificación');
    await user.type(input, 'a1b2c3d4e5f6g7h8');
    expect(input).toHaveValue('123456');
  });

  it('limpia espacios al pegar', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const input = screen.getByLabelText('Código de verificación');
    await user.click(input);
    await user.paste(' 12 34 56 ');
    expect(input).toHaveValue('123456');
  });

  it('llama a onComplete con 6 dígitos', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<Harness onComplete={onComplete} />);
    await user.type(screen.getByLabelText('Código de verificación'), '123456');
    expect(onComplete).toHaveBeenCalledWith('123456');
  });
});
