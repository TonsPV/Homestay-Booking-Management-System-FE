import { Navigate, useLocation } from "react-router-dom";

import { LoginPage, RegisterPage, useAuth } from "@/auth";

import { resolvePostLoginRoute } from "./workspace-policy";

function resolveNotice(state: unknown, search: string) {
  const stateNotice =
    typeof state === "object" &&
    state !== null &&
    "notice" in state &&
    typeof state.notice === "string"
      ? state.notice
      : undefined;

  return new URLSearchParams(search).get("notice") === "password-changed"
    ? "Đổi mật khẩu thành công. Vui lòng đăng nhập lại bằng mật khẩu mới."
    : stateNotice;
}

export function LoginRoute() {
  const { principal } = useAuth();
  const location = useLocation();

  if (principal) {
    return (
      <Navigate replace to={resolvePostLoginRoute(principal, location.state)} />
    );
  }

  return (
    <LoginPage
      locationState={location.state}
      notice={resolveNotice(location.state, location.search)}
      registerPath="/register"
    />
  );
}

/** Keeps existing operational-login bookmarks on the canonical form. */
export function ManagementLoginRoute() {
  const location = useLocation();

  return (
    <Navigate
      replace
      state={location.state}
      to={{ pathname: "/login", search: location.search }}
    />
  );
}

export const CustomerLoginRoute = LoginRoute;

export function RegisterRoute() {
  const { principal } = useAuth();

  if (principal) {
    return <Navigate replace to={resolvePostLoginRoute(principal)} />;
  }

  return <RegisterPage />;
}
