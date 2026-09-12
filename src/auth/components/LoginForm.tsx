import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { appConfig } from "@/app/config";
import { ApiError } from "@/api/errors";
import { resolvePostLoginRoute } from "@/routes/workspace-policy";

import type { AuthPrincipal } from "../types";
import { getAuthActionError } from "../errors";
import { Alert } from "@/shared/components/Feedback";
import { Button } from "@/shared/components/Button";
import { Field, Input, PasswordInput } from "@/shared/components/FormControls";

import { useAuth } from "../useAuth";
import { loginSchema, phoneSchema, type LoginFormValues } from "../validation";
import {
  formatRetryAfter,
  getRateLimitErrorMessage,
  useRateLimitCooldown,
} from "../useRateLimitCooldown";
import { AuthPageLayout } from "./AuthPageLayout";
import { GoogleSignInButton } from "./GoogleSignInButton";

interface LoginFormProps {
  description: string;
  locationState?: unknown;
  notice?: string;
  registerPath?: string | null;
  title: string;
}

export function LoginForm({
  description,
  locationState,
  notice,
  registerPath,
  title,
}: LoginFormProps) {
  const navigate = useNavigate();
  const auth = useAuth();
  const {
    formState: { errors },
    handleSubmit,
    register,
    watch,
  } = useForm<LoginFormValues>({
    defaultValues: {
      identifier: "",
      password: "",
      remember: false,
    },
    resolver: zodResolver(loginSchema),
  });
  const [googleCredential, setGoogleCredential] = useState<string | null>(null);
  const [googlePhone, setGooglePhone] = useState("");
  const [googlePhoneError, setGooglePhoneError] = useState<string | undefined>();
  const loginMutation = useMutation({
    mutationFn: async (values: LoginFormValues) => {
      const input = {
        identifier: values.identifier,
        password: values.password,
      };
      const persistence = values.remember
        ? ("local" as const)
        : ("session" as const);

      return auth.login(input, persistence);
    },
    onSuccess: (principal: AuthPrincipal) =>
      navigate(resolvePostLoginRoute(principal, locationState), {
        replace: true,
      }),
  });
  const googleLoginMutation = useMutation({
    mutationFn: async ({ credential, phone }: { credential: string; phone?: string }) => {
      if (!auth.loginCustomerWithGoogle) {
        throw new Error("Đăng nhập Google chưa được hỗ trợ.");
      }

      return auth.loginCustomerWithGoogle(
        {
          credential,
          ...(phone ? { phone } : {}),
        },
        watch("remember") ? "local" : "session",
      );
    },
    onSuccess: (principal: AuthPrincipal) => {
      setGoogleCredential(null);
      setGooglePhone("");
      setGooglePhoneError(undefined);
      navigate(resolvePostLoginRoute(principal, locationState), {
        replace: true,
      });
    },
  });
  const needsGooglePhone =
    googleCredential !== null &&
    googleLoginMutation.error instanceof ApiError &&
    googleLoginMutation.error.errorCode === "AUTH_GOOGLE_PHONE_REQUIRED";
  const handleGoogleCredential = (credential: string) => {
    setGoogleCredential(credential);
    setGooglePhoneError(undefined);
    googleLoginMutation.reset();
    googleLoginMutation.mutate({ credential });
  };
  const completeGoogleLogin = () => {
    if (!googleCredential) {
      return;
    }

    const result = phoneSchema.safeParse(googlePhone);

    if (!result.success) {
      setGooglePhoneError(result.error.issues[0]?.message ?? "Số điện thoại không hợp lệ.");
      return;
    }

    setGooglePhoneError(undefined);
    googleLoginMutation.mutate({
      credential: googleCredential,
      phone: result.data,
    });
  };
  const { isCoolingDown, remainingSeconds } = useRateLimitCooldown(
    loginMutation.error,
  );

  return (
    <AuthPageLayout
      description={description}
      eyebrow="Homi Stay"
      title={title}
    >
      <form
        className="grid gap-5"
        noValidate
        onSubmit={handleSubmit((values) => {
          if (!isCoolingDown && !loginMutation.isPending) {
            loginMutation.mutate(values);
          }
        })}
      >
        {notice ? <Alert tone="success">{notice}</Alert> : null}
        {loginMutation.error ? (
          <Alert title="Không thể đăng nhập" tone="error">
            {getRateLimitErrorMessage(
              loginMutation.error,
              remainingSeconds,
              getAuthActionError,
            )}
          </Alert>
        ) : null}

        <Field
          error={errors.identifier?.message}
          label="Email hoặc số điện thoại"
          required
        >
          <Input
            autoComplete="username"
            inputMode="text"
            placeholder="email@example.com hoặc 090..."
            {...register("identifier")}
          />
        </Field>

        <Field error={errors.password?.message} label="Mật khẩu" required>
          <PasswordInput
            autoComplete="current-password"
            placeholder="Nhập mật khẩu"
            {...register("password")}
          />
        </Field>

        <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl text-sm text-ink">
          <input
            className="size-5 rounded border-line accent-brand"
            type="checkbox"
            {...register("remember")}
          />
          Duy trì đăng nhập trên thiết bị này
        </label>

        <Button
          className="mt-1 w-full"
          disabled={isCoolingDown || loginMutation.isPending}
          loading={loginMutation.isPending}
          type="submit"
        >
          {loginMutation.isPending
            ? "Đang đăng nhập..."
            : isCoolingDown
              ? `Thử lại sau ${formatRetryAfter(remainingSeconds)}`
              : "Đăng nhập"}
        </Button>
      </form>

      <div className="mt-6 grid gap-4 border-t border-line pt-6">
        <div className="grid gap-1 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
            Hoặc tiếp tục với Google
          </p>
          <p className="text-xs text-muted">Dành cho tài khoản khách hàng</p>
        </div>

        {appConfig.googleClientId ? (
          <GoogleSignInButton
            clientId={appConfig.googleClientId}
            onCredential={handleGoogleCredential}
          />
        ) : (
          <div className="grid gap-2">
            <Button className="w-full" disabled type="button" variant="outline">
              Tiếp tục với Google
            </Button>
            <p className="text-center text-xs text-muted" role="status">
              Đăng nhập Google hiện chưa được bật.
            </p>
          </div>
        )}

        {appConfig.googleClientId ? (
          <>
            {googleLoginMutation.isPending ? (
              <p aria-live="polite" className="text-center text-sm text-muted">
                Đang xác thực tài khoản Google...
              </p>
            ) : null}
            {googleLoginMutation.error && !needsGooglePhone ? (
              <Alert title="Không thể đăng nhập bằng Google" tone="error">
                {getAuthActionError(googleLoginMutation.error)}
              </Alert>
            ) : null}
            {needsGooglePhone ? (
              <div className="grid gap-4 rounded-card border border-line bg-surface-muted p-4">
                <p className="text-sm leading-6 text-muted">
                  Vui lòng bổ sung số điện thoại để hoàn tất tài khoản Homi Stay.
                </p>
                <Field error={googlePhoneError} label="Số điện thoại" required>
                  <Input
                    autoComplete="tel"
                    inputMode="tel"
                    onChange={(event) => setGooglePhone(event.target.value)}
                    placeholder="090..."
                    value={googlePhone}
                  />
                </Field>
                <Button
                  disabled={googleLoginMutation.isPending}
                  loading={googleLoginMutation.isPending}
                  onClick={completeGoogleLogin}
                  type="button"
                >
                  Hoàn tất đăng nhập Google
                </Button>
              </div>
            ) : null}
          </>
        ) : null}
      </div>

      {registerPath ? (
        <div className="mt-6 border-t border-line pt-6 text-center text-sm">
          <p className="text-muted">
            Chưa có tài khoản?{" "}
            <Link
              className="inline-flex min-h-11 items-center font-bold text-brand-strong hover:underline"
              to={registerPath}
            >
              Đăng ký ngay
            </Link>
          </p>
        </div>
      ) : null}
    </AuthPageLayout>
  );
}
