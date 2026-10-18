import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../map/LocationPicker', () => ({
  default: ({ onChange }: { onChange: (lat: number, lng: number) => void }) => (
    <button type="button" onClick={() => onChange(6.2518, -75.568)}>
      mapa simulado
    </button>
  ),
}));

import { emptyParkingForm, toFormValues } from '../../domain/parkingForm';
import { MSG } from '../../lib/messages';
import { makeConfig, makeLot } from '../../test/fixtures';
import ParkingForm from './ParkingForm';

const setup = (props: Partial<React.ComponentProps<typeof ParkingForm>> = {}) => {
  const onSubmit = vi.fn();
  const onCancel = vi.fn();
  render(
    <ParkingForm
      mode="registrar"
      defaultValues={emptyParkingForm}
      onSubmit={onSubmit}
      onCancel={onCancel}
      {...props}
    />,
  );
  return { onSubmit, onCancel, user: userEvent.setup() };
};

describe('ParkingForm (registrar)', () => {
  it('no muestra el estado y el botón dice "Guardar"', () => {
    setup();
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeInTheDocument();
    expect(screen.queryByText('Estado del parqueadero')).not.toBeInTheDocument();
  });

  it('muestra los campos de tarifa y capacidad solo del tipo marcado', async () => {
    const { user } = setup();
    expect(screen.queryByLabelText(/Tarifa por hora \(Automóviles\)/)).not.toBeInTheDocument();

    await user.click(screen.getByRole('checkbox', { name: 'Automóviles' }));
    expect(screen.getByLabelText(/Tarifa por hora \(Automóviles\)/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Capacidad de celdas \(Automóviles\)/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Tarifa por hora \(Motocicletas\)/)).not.toBeInTheDocument();

    await user.click(screen.getByRole('checkbox', { name: 'Automóviles' }));
    expect(screen.queryByLabelText(/Tarifa por hora \(Automóviles\)/)).not.toBeInTheDocument();
  });

  it('enviar vacío muestra el resumen y no llama a onSubmit', async () => {
    const { user, onSubmit } = setup();
    await user.click(screen.getByRole('button', { name: 'Guardar' }));
    expect((await screen.findAllByText(MSG.parqueadero.requeridos)).length).toBeGreaterThan(0);
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getAllByText(MSG.parqueadero.campoObligatorio).length).toBeGreaterThan(0);
  });

  it('el mapa llena latitud y longitud', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: 'mapa simulado' }));
    expect(screen.getByLabelText(/Latitud/)).toHaveValue('6.2518');
    expect(screen.getByLabelText(/Longitud/)).toHaveValue('-75.568');
  });

  it('avisa si la ubicación está fuera de Medellín sin bloquear', async () => {
    const { user } = setup();
    await user.type(screen.getByLabelText(/Latitud/), '4.7110');
    await user.type(screen.getByLabelText(/Longitud/), '-74.0721');
    expect(await screen.findByText(MSG.parqueadero.fueraDeMedellin)).toBeInTheDocument();
  });

  it('con datos válidos llama a onSubmit; "Cancelar" llama a onCancel', async () => {
    const { user, onSubmit, onCancel } = setup();
    await user.type(screen.getByLabelText(/Nombre del parqueadero/), 'Parqueadero Centro');
    await user.type(screen.getByLabelText(/Dirección/), 'Calle 50 # 45-10');
    await user.click(screen.getByRole('button', { name: 'mapa simulado' }));
    await user.type(screen.getByLabelText(/Teléfono de contacto/), '3001234567');
    await user.type(screen.getByLabelText(/Horario de atención/), '24 horas');
    await user.click(screen.getByRole('checkbox', { name: 'Automóviles' }));
    await user.type(screen.getByLabelText(/Tarifa por hora \(Automóviles\)/), '5000');
    await user.type(screen.getByLabelText(/Capacidad de celdas \(Automóviles\)/), '20');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ name: 'Parqueadero Centro', servesCars: true, carRate: '5000' });

    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onCancel).toHaveBeenCalled();
  });

  it('muestra el error del servidor en el pie', () => {
    setup({ serverError: { message: MSG.general.permisoDenegado } });
    expect(screen.getByText(MSG.general.permisoDenegado)).toBeInTheDocument();
  });
});

describe('ParkingForm (editar)', () => {
  const lot = makeLot({
    parking_vehicle_configs: [makeConfig('CAR', { total: 20, occupied: 5 }), makeConfig('MOTORCYCLE', { total: 0, occupied: 0 })],
  });
  const edit = (props: Partial<React.ComponentProps<typeof ParkingForm>> = {}) =>
    setup({ mode: 'editar', defaultValues: toFormValues(lot), savedConfigs: lot.parking_vehicle_configs, ...props });

  it('precarga los datos, muestra el Estado y "Guardar cambios"', () => {
    edit();
    expect(screen.getByLabelText(/Nombre del parqueadero/)).toHaveValue('Parqueadero Centro');
    expect(screen.getByLabelText(/Tarifa por hora \(Automóviles\)/)).toHaveValue('5000');
    expect(screen.getByRole('radio', { name: /Activo/ })).toBeChecked();
    expect(screen.getByText('El parqueadero no aparece en el mapa y no está disponible.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeInTheDocument();
  });

  it('desmarcar un tipo con capacidad guardada > 0 lo mantiene marcado y avisa', async () => {
    const { user } = edit();
    await user.click(screen.getByRole('checkbox', { name: 'Automóviles' }));
    expect(screen.getByRole('checkbox', { name: 'Automóviles' })).toBeChecked();
    expect(await screen.findByText(MSG.parqueadero.quitarTipo)).toBeInTheDocument();
  });

  it('desmarcar un tipo guardado con capacidad 0 sí lo quita', async () => {
    const { user } = edit();
    await user.click(screen.getByRole('checkbox', { name: 'Motocicletas' }));
    expect(screen.getByRole('checkbox', { name: 'Motocicletas' })).not.toBeChecked();
  });

  it('un tipo guardado admite capacidad 0', async () => {
    const { user, onSubmit } = edit();
    const spaces = screen.getByLabelText(/Capacidad de celdas \(Automóviles\)/);
    await user.clear(spaces);
    await user.type(spaces, '5');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
  });

  it('cambiar el estado a Inactivo', async () => {
    const { user, onSubmit } = edit();
    await user.click(screen.getByRole('radio', { name: /Inactivo/ }));
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0].status).toBe('inactivo');
  });

  it('un error de capacidad del servidor se ubica en el campo del tipo', async () => {
    edit({
      serverError: { message: MSG.celdas.reducir, code: 'CAPACIDAD_MENOR_A_OCUPADAS', vehicleType: 'CAR' },
    });
    const field = screen.getByLabelText(/Capacidad de celdas \(Automóviles\)/);
    await waitFor(() => expect(field).toHaveAttribute('aria-invalid', 'true'));
  });
});
