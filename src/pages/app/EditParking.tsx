import { useState } from 'react';
import { useNavigate } from 'react-router';
import FormPage from '../../components/parking/FormPage';
import ParkingForm, { type ParkingServerError } from '../../components/parking/ParkingForm';
import { toFormValues, toParkingInput } from '../../domain/parkingForm';
import type { ParkingFormValues } from '../../domain/schemas/parking';
import { useMyParking } from '../../hooks/useMyParking';
import { MSG } from '../../lib/messages';
import { updateParkingLot } from '../../services/adminParking';

/** HU5: editar la información del parqueadero propio. */
const EditParking = () => {
  const navigate = useNavigate();
  const my = useMyParking();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<ParkingServerError | null>(null);
  // Cambia tras un guardado parcial para volver a montar el formulario con los datos recargados.
  const [formKey, setFormKey] = useState(0);

  if (my.state !== 'con_parqueadero') return null;
  const { parking } = my;

  const onSubmit = async (values: ParkingFormValues) => {
    setSubmitting(true);
    setServerError(null);

    const result = await updateParkingLot({ ...toParkingInput(values), status: values.status === 'activo' });

    if (result.ok) {
      await my.reload();
      navigate('/admin', { replace: true, state: { flash: MSG.parqueadero.actualizado } });
      return;
    }

    if (result.code === 'GUARDADO_PARCIAL') {
      await my.reload();
      setFormKey((k) => k + 1);
    }

    setServerError({ message: result.message, code: result.code, vehicleType: result.vehicleType });
    setSubmitting(false);
  };

  return (
    <FormPage
      title="Editar mi parqueadero"
      subtitle="Actualiza la información de tu parqueadero para mantener los datos correctos y vigentes."
      crumbs={[{ label: 'Mi parqueadero', to: '/admin' }, { label: 'Editar' }]}
      status={parking.status}
    >
      <ParkingForm
        key={`${parking.updated_at}-${formKey}`}
        mode="editar"
        defaultValues={toFormValues(parking)}
        savedConfigs={parking.parking_vehicle_configs}
        onSubmit={onSubmit}
        onCancel={() => navigate('/admin')}
        submitting={submitting}
        serverError={serverError}
      />
    </FormPage>
  );
};

export default EditParking;
