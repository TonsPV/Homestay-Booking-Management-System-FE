import { LoginForm } from "../components/LoginForm";

interface LoginPageProps {
  locationState?: unknown;
  notice?: string;
  registerPath?: string | null;
}

export function LoginPage({
  locationState,
  notice,
  registerPath = "/register",
}: LoginPageProps) {
  return (
    <LoginForm
      description="Đăng nhập để tiếp tục với Homi Stay."
      locationState={locationState}
      notice={notice}
      registerPath={registerPath}
      title="Đăng nhập"
    />
  );
}
