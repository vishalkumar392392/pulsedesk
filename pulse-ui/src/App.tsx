import { Navigate, Route, Routes } from "react-router";
import "./App.css";
import { PageNotFound } from "./components/Login/PageNotFound";
import UserForm from "./components/Util/Example";
import { Layout } from "./components/Layout/Layout";
import { Assets } from "./components/Assets/Assets";
import { Users } from "./components/Users/Users";
import { Reports } from "./components/Reports/Reports";
import Dashboard from "./components/Dashboard/Dashboard";
import { Login } from "./components/Login/Login";
import Loader from "./components/Util/Loader";
import { Modal } from "./components/Util/Modal";
import { Tickets } from "./components/Tickets/Tickets";
import { TicketForm } from "./components/Tickets/TicketForm";
import { Settings } from "./components/Settings/Settings";
import { NotAuthorized } from "./components/Login/NotAuthorized";
import { ProtectedRoute } from "./components/Routes/ProtectedRoute";
import { ADMIN_ONLY, EMPLOYEE_ONLY, SUPPORT_ROLES } from "./util/accessControl";

function App() {
  return (
    <>
      <Modal />
      <Loader />
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tickets" element={<Tickets />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/not-authorized" element={<NotAuthorized />} />

            <Route element={<ProtectedRoute allowedRoles={EMPLOYEE_ONLY} />}>
              <Route path="/tickets/create" element={<TicketForm />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={SUPPORT_ROLES} />}>
              <Route path="/assets" element={<Assets />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={ADMIN_ONLY} />}>
              <Route path="/users" element={<Users />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/example" element={<UserForm />} />
            </Route>

            <Route path="*" element={<PageNotFound />} />
          </Route>
        </Route>
        <Route path="/login" element={<Login />} />
      </Routes>
    </>
  );
}

export default App;
