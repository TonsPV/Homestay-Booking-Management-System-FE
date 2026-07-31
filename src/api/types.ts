import type {
  ErrorEnvelopeDto,
  PaginationDto,
  PaymentManagementMetaDto,
  SuccessEnvelopeDto,
} from './generated'

export type Pagination = PaginationDto

export interface ApiMeta
  extends Partial<Pick<PaymentManagementMetaDto, 'staleRefundCount'>> {
  pagination?: Pagination
}

export interface ApiSuccess<T>
  extends Omit<SuccessEnvelopeDto, 'data' | 'success'> {
  success: true
  data: T
  meta?: ApiMeta
}

export interface ApiFailure extends Omit<ErrorEnvelopeDto, 'success'> {
  success: false
  code?: string
  details?: unknown
  fieldErrors?: Record<string, string[]>
}

export interface ApiResult<T> {
  data: T
  meta?: ApiMeta
  requestId: string
}

export type QueryPrimitive = string | number | boolean | null | undefined

export type QueryParams = Record<
  string,
  QueryPrimitive | QueryPrimitive[]
>
