import { BrowserRouter } from "react-router";
import AppRouter from "./router";

const App = () => {
  return (
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  );
};

export default App;
