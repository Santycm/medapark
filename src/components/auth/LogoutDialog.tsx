import { useState } from 'react';
import { useNavigate } from 'react-router';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { MSG } from '../../lib/messages';
import Button from '../common/Button';
import Modal from '../common/Modal';

type Props = { open: boolean; onClose: () => void };

const LogoutDialog = ({ open, onClose }: Props) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    setBusy(true);
    await signOut();
    setBusy(false);
    onClose();
    navigate('/admin/login', { replace: true });
  };

  return (
    <Modal open={open} onClose={onClose} title={MSG.logout.titulo} initialFocusSelector="[data-cancel]">
      <div className="text-center">
        <div className="mx-auto flex h-[76px] w-[76px] items-center justify-center rounded-full bg-danger-50 text-danger-600">
          <LogOut size={34} aria-hidden="true" />
        </div>
        <p className="mt-3 text-3xl font-bold text-navy-900" aria-hidden="true">
          {MSG.logout.titulo}
        </p>
        <p className="mt-3 text-lg font-semibold text-navy-900">{MSG.logout.pregunta}</p>
        <p className="mt-1 text-sm text-ink-500">{MSG.logout.detalle}</p>
      </div>

      <div className="mt-8 flex gap-3.5">
        <Button variant="secondary" fullWidth onClick={onClose} disabled={busy} data-cancel>
          Cancelar
        </Button>
        <Button variant="danger" fullWidth onClick={confirm} loading={busy}>
          Cerrar sesión
        </Button>
      </div>
    </Modal>
  );
};

export default LogoutDialog;
