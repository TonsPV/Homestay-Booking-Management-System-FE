import { apiRequest } from "@/api/client";
import type {
  AuthCustomerDto,
  AuthLoginResponseDto,
  AuthMeCustomerResponseDto,
  AuthMeUserResponseDto,
} from "@/api/generated";

import type {
  CustomerLoginInput,
  GoogleCustomerLoginInput,
  LoginResponse,
  RegisterCustomerInput,
  UserLoginInput,
} from "./types";

function normalizeLoginResponse(response: AuthLoginResponseDto): LoginResponse {
  if (response.actorType === "customer" && response.customer) {
    return {
      accessToken: response.accessToken,
      actorType: "customer",
      customer: response.customer,
      expiresIn: response.expiresIn,
      tokenType: response.tokenType,
    };
  }

  if (response.actorType === "user" && response.user) {
    return {
      accessToken: response.accessToken,
      actorType: "user",
      expiresIn: response.expiresIn,
      tokenType: response.tokenType,
      user: response.user,
    };
  }

  throw new Error("Máy chủ trả về dữ liệu đăng nhập không hợp lệ.");
}

export async function registerCustomer(input: RegisterCustomerInput) {
  const result = await apiRequest<AuthCustomerDto>("/auth/customers/register", {
    auth: false,
    body: input,
    method: "POST",
  });

  return result.data;
}

export async function loginCustomer(input: CustomerLoginInput) {
  const result = await apiRequest<AuthLoginResponseDto>(
    "/auth/customers/login",
    {
      auth: false,
      body: input,
      method: "POST",
    },
  );

  if (result.data.actorType !== "customer") {
    throw new Error("Máy chủ trả về sai loại tài khoản khách hàng.");
  }

  return normalizeLoginResponse(result.data);
}

export async function loginUser(input: UserLoginInput) {
  const result = await apiRequest<AuthLoginResponseDto>("/auth/users/login", {
    auth: false,
    body: input,
    method: "POST",
  });

  if (result.data.actorType !== "user") {
    throw new Error("Máy chủ trả về sai loại tài khoản quản trị.");
  }

  return normalizeLoginResponse(result.data);
}

export async function loginCustomerWithGoogle(
  input: GoogleCustomerLoginInput,
) {
  const result = await apiRequest<AuthLoginResponseDto>(
    "/auth/customers/google/login",
    {
      auth: false,
      body: input,
      method: "POST",
    },
  );

  if (result.data.actorType !== "customer") {
    throw new Error("Máy chủ trả về sai loại tài khoản khách hàng.");
  }

  return normalizeLoginResponse(result.data);
}

/** The canonical sign-in flow lets the server resolve the account role. */
export async function login(
  input: CustomerLoginInput | UserLoginInput,
): Promise<LoginResponse> {
  const result = await apiRequest<AuthLoginResponseDto>("/auth/login", {
    auth: false,
    body: input,
    method: "POST",
  });

  return normalizeLoginResponse(result.data);
}

export async function getMe(signal?: AbortSignal) {
  const result = await apiRequest<
    AuthMeCustomerResponseDto | AuthMeUserResponseDto
  >("/auth/me", { signal });

  return result.data;
}
