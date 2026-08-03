import { Route, Routes } from "react-router";
import "./App.css";
import { PageNotFound } from "./components/Login/PageNotFound";
import UserForm from "./components/Util/Example";
import { Tickets } from "./components/Tickets/Tickets";
import { Layout } from "./components/Layout/Layout";
import { Assets } from "./components/Assets/Assets";
import { Users } from "./components/Users/Users";
import { Reports } from "./components/Reports/Reports";
import Dashboard from "./components/Dashboard/Dashboard";
import { Login } from "./components/Login/Login";
import Loader from "./components/Util/Loader";
import { Modal } from "./components/Util/Modal";

function App() {
  return (
    <>
      <Modal />
      <Loader />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tickets" element={<Tickets />} />
          <Route path="/assets" element={<Assets />} />
          <Route path="/users" element={<Users />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/example" element={<UserForm />} />
          <Route path="*" element={<PageNotFound />} />
        </Route>
        <Route path="/login" element={<Login />} />
      </Routes>
    </>
  );
}

export default App;
