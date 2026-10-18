import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import { AuthContext } from '../../context/authContext';
import type { AuthStage } from '../../domain/authStage';
import { makeAuth } from '../../test/renderWithAuth';
import RedirectIfAuthenticated from './RedirectIfAuthenticated';
import RequireAal2 from './RequireAal2';
import RequirePendingMfa from './RequirePendingMfa';

const STAGES: AuthStage[] = [
  'anonimo',
  'requiere_enrolamiento',
  'requiere_verificacion',
  'autenticado',
];

const stub = (name: string) => <p>pantalla:{name}</p>;

function renderAt(path: string, stage: AuthStage) {
  return render(
    <AuthContext.Provider value={makeAuth({ stage })}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route element={<RedirectIfAuthenticated />}>
            <Route path="/admin/login" element={stub('login')} />
          </Route>
          <Route element={<RequirePendingMfa expected="requiere_enrolamiento" />}>
            <Route path="/admin/mfa/configurar" element={stub('configurar')} />
          </Route>
          <Route element={<RequirePendingMfa expected="requiere_verificacion" />}>
            <Route path="/admin/mfa/verificar" element={stub('verificar')} />
          </Route>
          <Route element={<RequireAal2 />}>
            <Route path="/admin" element={stub('panel')} />
            <Route path="/admin/otra" element={stub('panel')} />
            <Route path="/profile" element={stub('panel')} />
            <Route path="/setup-mfa" element={stub('panel')} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

// Matriz de contracts/routes.md: [ruta, resultado por stage en el orden de STAGES]
// 'self' = renderiza la propia ruta; el resto es el destino de la redirección.
const MATRIX: Array<[string, string, string[]]> = [
  ['/admin/login', 'login', ['self', 'configurar', 'verificar', 'panel']],
  ['/admin/mfa/configurar', 'configurar', ['login', 'self', 'verificar', 'panel']],
  ['/admin/mfa/verificar', 'verificar', ['login', 'configurar', 'self', 'panel']],
  ['/admin', 'panel', ['login', 'configurar', 'verificar', 'self']],
  ['/admin/otra', 'panel', ['login', 'configurar', 'verificar', 'self']],
  ['/profile', 'panel', ['login', 'configurar', 'verificar', 'self']],
  ['/setup-mfa', 'panel', ['login', 'configurar', 'verificar', 'self']],
];

describe('matriz de acceso', () => {
  for (const [path, own, results] of MATRIX) {
    STAGES.forEach((stage, index) => {
      const expected = results[index] === 'self' ? own : results[index];
      it(`${path} con ${stage} → ${expected}`, () => {
        renderAt(path, stage);
        expect(screen.getByText(`pantalla:${expected}`)).toBeInTheDocument();
      });
    });
  }

  it('con stage cargando muestra el Loader y no redirige', () => {
    renderAt('/admin', 'cargando');
    expect(screen.getByText('Cargando MedaPark')).toBeInTheDocument();
    expect(screen.queryByText(/pantalla:/)).not.toBeInTheDocument();
  });
});
