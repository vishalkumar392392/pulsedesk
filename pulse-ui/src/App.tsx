import { Route, Routes } from "react-router";
import "./App.css";
import Dashboard from "./components/Dashboard/Dashboard";
import { PageNotFound } from "./components/Login/PageNotFound";
import UserForm from "./components/Util/Example";
import { Tickets } from "./components/Tickets/Tickets";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tickets" element={<Tickets />} />
        <Route path="/example" element={<UserForm />} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </>
  );
}

export default App;
