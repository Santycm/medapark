import Alert from '../../components/common/Alert';
import Button from '../../components/common/Button';

type Props = { message: string; onRetry: () => unknown };

const ParkingLoadError = ({ message, onRetry }: Props) => (
  <div className="mx-auto max-w-xl space-y-4 py-10">
    <Alert>{message}</Alert>
    <Button variant="secondary" onClick={() => void onRetry()}>
      Reintentar
    </Button>
  </div>
);

export default ParkingLoadError;
