import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import Modal from './Modal';

const setup = (onClose = vi.fn()) =>
  render(
    <>
      <button>disparador</button>
      <Modal open onClose={onClose} title="Título accesible">
        <button>primero</button>
        <button>último</button>
      </Modal>
    </>,
  );

describe('Modal', () => {
  it('tiene role dialog, nombre accesible y enfoca el primer elemento', () => {
    setup();
    expect(screen.getByRole('dialog', { name: 'Título accesible' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'primero' })).toHaveFocus();
  });

  it('atrapa el foco con Tab y Shift+Tab', async () => {
    const user = userEvent.setup();
    setup();
    await user.tab();
    expect(screen.getByRole('button', { name: 'último' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'primero' })).toHaveFocus();
    await user.tab({ shift: true });
    expect(screen.getByRole('button', { name: 'último' })).toHaveFocus();
  });

  it('Esc llama a onClose', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    setup(onClose);
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('no renderiza nada cuando está cerrado', () => {
    render(
      <Modal open={false} onClose={() => {}} title="x">
        contenido
      </Modal>,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
