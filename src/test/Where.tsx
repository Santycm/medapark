import { useLocation } from 'react-router';

/** Muestra la ruta actual: sirve para comprobar redirecciones y navegaciones en las pruebas. */
const Where = () => <p data-testid="where">{useLocation().pathname}</p>;

export default Where;
