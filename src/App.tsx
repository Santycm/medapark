import { BrowserRouter } from "react-router";
import AppRouter from "./router";
import AuthProvider from "./context/AuthProvider";

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
