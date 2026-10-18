import { useState } from 'react';
import { useNavigate } from 'react-router';
import FormPage from '../../components/parking/FormPage';
import ParkingForm, { type ParkingServerError } from '../../components/parking/ParkingForm';
import { emptyParkingForm, toParkingInput } from '../../domain/parkingForm';
import type { ParkingFormValues } from '../../domain/schemas/parking';
import { useAuth } from '../../hooks/useAuth';
import { useMyParking } from '../../hooks/useMyParking';
import { MSG } from '../../lib/messages';
import { registerParkingLot } from '../../services/adminParking';

/** HU3: registrar el parqueadero del administrador. */
const RegisterParking = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { reload } = useMyParking();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<ParkingServerError | null>(null);

  const onSubmit = async (values: ParkingFormValues) => {
    if (!user) return;
    setSubmitting(true);
    setServerError(null);

    const result = await registerParkingLot(user.id, toParkingInput(values));

    if (result.ok) {
      await reload();
      navigate('/admin', { replace: true, state: { flash: MSG.parqueadero.registrado } });
      return;
    }

    if (result.code === 'REGISTRO_INCOMPLETO' || result.code === 'YA_EXISTE') {
      await reload();
      navigate('/admin', { replace: true, state: { flash: result.message } });
      return;
    }

    setServerError({ message: result.message, code: result.code, vehicleType: result.vehicleType });
    setSubmitting(false);
  };

  return (
    <FormPage
      title="Registrar parqueadero"
      subtitle="Ingresa la información básica del parqueadero para administrarlo en el sistema."
    >
      <ParkingForm
        mode="registrar"
        defaultValues={emptyParkingForm}
        onSubmit={onSubmit}
        onCancel={() => navigate('/admin')}
        submitting={submitting}
        serverError={serverError}
      />
    </FormPage>
  );
};

export default RegisterParking;
