import type {
  AuthCustomerDto,
  AuthLoginResponseDto,
  AuthMeCustomerResponseDto,
  AuthMeUserResponseDto,
  AuthUserDto,
  GoogleCustomerLoginDtoWritable,
  LoginDtoWritable,
  RegisterCustomerDtoWritable,
} from '@/api/generated'

export type ActorType = AuthLoginResponseDto['actorType']
export type UserRole = AuthUserDto['role']
export type AccountStatus = AuthUserDto['status']

export type Customer = AuthCustomerDto
export type User = AuthUserDto

type AccessTokenData = Pick<
  AuthLoginResponseDto,
  'accessToken' | 'expiresIn' | 'tokenType'
>

export type LoginResponse =
  | (AccessTokenData & {
      actorType: 'customer'
      customer: Customer
      user?: never
    })
  | (AccessTokenData & {
      actorType: 'user'
      customer?: never
      user: User
    })

export type MeResponse =
  | AuthMeCustomerResponseDto
  | AuthMeUserResponseDto

export type AuthPrincipal =
  | (Customer & {
      actorType: 'customer'
      role?: never
    })
  | (User & {
      actorType: 'user'
    })

export type AuthPersistence = 'local' | 'session'
export type AuthStatus =
  | 'anonymous'
  | 'authenticated'
  | 'error'
  | 'restoring'

export interface AuthSession {
  accessToken: string
  expiresAt: number
  persistence: AuthPersistence
  principal: AuthPrincipal
  tokenType: 'Bearer'
}

export type CustomerLoginInput = LoginDtoWritable
export type UserLoginInput = LoginDtoWritable
export type RegisterCustomerInput = RegisterCustomerDtoWritable

export type GoogleCustomerLoginInput = GoogleCustomerLoginDtoWritable

export function principalFromMe(response: MeResponse): AuthPrincipal {
  if (response.actorType === 'customer') {
    return {
      actorType: 'customer',
      ...response.customer,
    }
  }

  return {
    actorType: 'user',
    ...response.user,
  }
}

export function principalFromLogin(response: LoginResponse): AuthPrincipal {
  return response.actorType === 'customer'
    ? {
        actorType: 'customer',
        ...response.customer,
      }
    : {
        actorType: 'user',
        ...response.user,
      }
}

export function meFromPrincipal(principal: AuthPrincipal): MeResponse {
  if (principal.actorType === 'customer') {
    const { actorType: _actorType, ...customer } = principal

    return { actorType: 'customer', customer }
  }

  const { actorType: _actorType, ...user } = principal

  return { actorType: 'user', user }
}
