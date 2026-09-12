import { apiRequest } from '@/api/client'
import type {
  AuthCustomerDto,
  AuthLoginResponseDto,
  AuthMeCustomerResponseDto,
  AuthMeUserResponseDto,
} from '@/api/generated'
import { ApiError } from '@/api/errors'

import type {
  CustomerLoginInput,
  LoginResponse,
  RegisterCustomerInput,
  UserLoginInput,
} from './types'

function normalizeLoginResponse(
  response: AuthLoginResponseDto,
  expectedActor: 'customer' | 'user',
): LoginResponse {
  if (expectedActor === 'customer' && response.customer) {
    return {
      accessToken: response.accessToken,
      actorType: 'customer',
      customer: response.customer,
      expiresIn: response.expiresIn,
      tokenType: response.tokenType,
    }
  }

  if (expectedActor === 'user' && response.user) {
    return {
      accessToken: response.accessToken,
      actorType: 'user',
      expiresIn: response.expiresIn,
      tokenType: response.tokenType,
      user: response.user,
    }
  }

  throw new Error('Máy chủ trả về dữ liệu đăng nhập không hợp lệ.')
}

export async function registerCustomer(input: RegisterCustomerInput) {
  const result = await apiRequest<AuthCustomerDto>('/auth/customers/register', {
    auth: false,
    body: input,
    method: 'POST',
  })

  return result.data
}

export async function loginCustomer(input: CustomerLoginInput) {
  const result = await apiRequest<AuthLoginResponseDto>('/auth/customers/login', {
    auth: false,
    body: input,
    method: 'POST',
  })

  if (result.data.actorType !== 'customer') {
    throw new Error('Máy chủ trả về sai loại tài khoản khách hàng.')
  }

  return normalizeLoginResponse(result.data, 'customer')
}

export async function loginUser(input: UserLoginInput) {
  const result = await apiRequest<AuthLoginResponseDto>('/auth/users/login', {
    auth: false,
    body: input,
    method: 'POST',
  })

  if (result.data.actorType !== 'user') {
    throw new Error('Máy chủ trả về sai loại tài khoản quản trị.')
  }

  return normalizeLoginResponse(result.data, 'user')
}

/* Legacy actor discovery for callers that do not know their login surface.
 * Customer and operations screens must call their actor-specific endpoint so
 * a staff login never probes the customer credential store first. */
export async function login(
  input: CustomerLoginInput | UserLoginInput,
): Promise<LoginResponse> {
  try {
    return await loginCustomer(input)
  } catch (error) {
    if (error instanceof ApiError && error.isStatus(401)) {
      return loginUser(input)
    }

    throw error
  }
}

export async function getMe(signal?: AbortSignal) {
  const result = await apiRequest<
    AuthMeCustomerResponseDto | AuthMeUserResponseDto
  >('/auth/me', { signal })

  return result.data
}
