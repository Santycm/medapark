import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { googleMapsUrl } from '../../domain/publicParking';
import { MSG } from '../../lib/messages';
import { offer, publicParking } from '../../test/publicFixtures';
import ParkingDetailPanel from './ParkingDetailPanel';

const show = (parking = publicParking('A'), onClose = vi.fn()) => {
  render(<ParkingDetailPanel parking={parking} onClose={onClose} />);
  return { onClose };
};

describe('ParkingDetailPanel', () => {
  it('muestra nombre, dirección, horario y teléfono como enlace tel:', () => {
    show();
    expect(screen.getByRole('dialog', { name: 'Parqueadero A' })).toBeInTheDocument();
    expect(screen.getByText('Calle A # 45-10, Medellín')).toBeInTheDocument();
    expect(screen.getByText('Lunes a Domingo, 6:00 a.m. - 10:00 p.m.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '3001234567' })).toHaveAttribute('href', 'tel:3001234567');
  });

  it('el correo solo se muestra si existe', () => {
    const { unmount } = render(<ParkingDetailPanel parking={publicParking('A')} onClose={() => {}} />);
    expect(screen.queryByText('contacto@dominio.com')).not.toBeInTheDocument();
    unmount();
    show(publicParking('A', { contact_email: 'contacto@dominio.com' }));
    expect(screen.getByText('contacto@dominio.com')).toBeInTheDocument();
  });

  it('muestra disponibilidad y tarifas solo de las ofertas presentes', () => {
    show(publicParking('A', { offers: [offer('CAR', { available: 12, total: 20, rate: 5000 })] }));
    expect(screen.getAllByText('Automóviles').length).toBeGreaterThan(0);
    expect(screen.getByText('$ 5.000')).toBeInTheDocument();
    expect(screen.getByText('por hora')).toBeInTheDocument();
    expect(screen.queryByText('Motocicletas')).not.toBeInTheDocument();
  });

  it('con dos ofertas muestra las dos tarifas', () => {
    show(publicParking('A', { offers: [offer('CAR', { rate: 5000 }), offer('MOTORCYCLE', { rate: 2000, available: 0 })] }));
    expect(screen.getByText('$ 5.000')).toBeInTheDocument();
    expect(screen.getByText('$ 2.000')).toBeInTheDocument();
  });

  it('incluye la nota del último estado registrado', () => {
    show();
    expect(screen.getByText(MSG.publico.notaUltimoEstado)).toBeInTheDocument();
  });

  it('la "X" llama a onClose y recibe el foco inicial', async () => {
    const user = userEvent.setup();
    const { onClose } = show();
    const close = screen.getByRole('button', { name: 'Cerrar detalle' });
    expect(close).toHaveFocus();
    await user.click(close);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('"Cómo llegar" es un enlace a Google Maps en pestaña nueva', () => {
    show(publicParking('A', { latitude: 6.2518, longitude: -75.568 }));
    const link = screen.getByRole('link', { name: /Cómo llegar a Parqueadero A/ });
    expect(link).toHaveAttribute('href', googleMapsUrl(6.2518, -75.568));
    expect(link).toHaveAttribute('target', '_blank');
    expect(link.getAttribute('rel')).toContain('noopener');
  });

  it('sin coordenadas válidas no se muestra "Cómo llegar"', () => {
    show(publicParking('A', { latitude: Number.NaN }));
    expect(screen.queryByRole('link', { name: /Cómo llegar/ })).not.toBeInTheDocument();
  });
});
