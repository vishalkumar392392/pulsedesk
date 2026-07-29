import { Route, Routes } from "react-router";
import "./App.css";
import Dashboard from "./components/Dashboard/Dashboard";
import { PageNotFound } from "./components/Login/PageNotFound";
import UserForm from "./components/Util/Example";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/example" element={<UserForm />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
}

export default App;
