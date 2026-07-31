import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { getErrorMessage } from '@/api/errors'
import type { User } from '@/auth/types'
import { Button } from '@/shared/components/Button'
import { Alert } from '@/shared/components/Feedback'
import { Field, Input } from '@/shared/components/FormControls'

import {
  useCreateUserMutation,
  useUpdateUserMutation,
} from '../queries'
import {
  createUserSchema,
  type CreateUserFormValues,
  type UpdateUserFormValues,
  updateUserSchema,
} from '../validation'

interface UserFormCallbacks {
  onCancel?: () => void
  onSaved?: (user: User) => void
}

function FormActions({
  loading,
  onCancel,
  submitLabel,
}: {
  loading: boolean
  onCancel?: () => void
  submitLabel: string
}) {
  return (
    <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
      {onCancel ? (
        <Button onClick={onCancel} variant="outline">
          Hủy
        </Button>
      ) : null}
      <Button loading={loading} type="submit">
        {submitLabel}
      </Button>
    </div>
  )
}

export function CreateUserForm({ onCancel, onSaved }: UserFormCallbacks) {
  const mutation = useCreateUserMutation()
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<CreateUserFormValues>({
    defaultValues: {
      confirmPassword: '',
      email: '',
      fullName: '',
      password: '',
      phone: '',
    },
    resolver: zodResolver(createUserSchema),
  })

  return (
    <form
      className="grid gap-5"
      noValidate
      onSubmit={handleSubmit((values) =>
        mutation.mutate(
          {
            email: values.email,
            fullName: values.fullName,
            password: values.password,
            phone: values.phone || null,
          },
          { onSuccess: onSaved },
        ),
      )}
    >
      {mutation.error ? (
        <Alert title="Không thể tạo nhân viên" tone="error">
          {getErrorMessage(mutation.error)}
        </Alert>
      ) : null}

      <Alert tone="info">
        Tài khoản mới luôn được tạo với vai trò Nhân viên và trạng thái hoạt
        động.
      </Alert>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field error={errors.fullName?.message} label="Họ và tên" required>
          <Input autoComplete="name" {...register('fullName')} />
        </Field>
        <Field error={errors.email?.message} label="Email" required>
          <Input
            autoComplete="email"
            inputMode="email"
            type="email"
            {...register('email')}
          />
        </Field>
      </div>
      <Field
        error={errors.phone?.message}
        hint="Không bắt buộc."
        label="Số điện thoại"
      >
        <Input autoComplete="tel" inputMode="tel" {...register('phone')} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field error={errors.password?.message} label="Mật khẩu" required>
          <Input
            autoComplete="new-password"
            type="password"
            {...register('password')}
          />
        </Field>
        <Field
          error={errors.confirmPassword?.message}
          label="Xác nhận mật khẩu"
          required
        >
          <Input
            autoComplete="new-password"
            type="password"
            {...register('confirmPassword')}
          />
        </Field>
      </div>

      <FormActions
        loading={mutation.isPending}
        onCancel={onCancel}
        submitLabel="Tạo nhân viên"
      />
    </form>
  )
}

interface UpdateUserFormProps extends UserFormCallbacks {
  user: User
}

export function UpdateUserForm({
  onCancel,
  onSaved,
  user,
}: UpdateUserFormProps) {
  const mutation = useUpdateUserMutation()
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<UpdateUserFormValues>({
    defaultValues: {
      email: user.email,
      fullName: user.fullName,
      password: '',
      phone: user.phone ?? '',
    },
    resolver: zodResolver(updateUserSchema),
  })

  return (
    <form
      className="grid gap-5"
      noValidate
      onSubmit={handleSubmit((values) =>
        mutation.mutate(
          {
            id: user.id,
            input: {
              email: values.email,
              fullName: values.fullName,
              phone: values.phone || null,
              ...(values.password ? { password: values.password } : {}),
            },
          },
          { onSuccess: onSaved },
        ),
      )}
    >
      {mutation.error ? (
        <Alert title="Không thể cập nhật nhân viên" tone="error">
          {getErrorMessage(mutation.error)}
        </Alert>
      ) : null}

      <Alert tone="info">
        Vai trò hiện tại:{' '}
        <strong>
          {user.role === 'ADMIN' ? 'Quản trị viên' : 'Nhân viên'}
        </strong>
        . Vai trò tài khoản không được thay đổi tại màn hình này.
      </Alert>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field error={errors.fullName?.message} label="Họ và tên" required>
          <Input autoComplete="name" {...register('fullName')} />
        </Field>
        <Field error={errors.email?.message} label="Email" required>
          <Input
            autoComplete="email"
            inputMode="email"
            type="email"
            {...register('email')}
          />
        </Field>
      </div>
      <Field
        error={errors.phone?.message}
        hint="Để trống để xóa số điện thoại."
        label="Số điện thoại"
      >
        <Input autoComplete="tel" inputMode="tel" {...register('phone')} />
      </Field>
      <Field
        error={errors.password?.message}
        hint="Để trống nếu không đổi. Đổi mật khẩu sẽ thu hồi các phiên đăng nhập cũ."
        label="Mật khẩu mới"
      >
        <Input
          autoComplete="new-password"
          type="password"
          {...register('password')}
        />
      </Field>

      <FormActions
        loading={mutation.isPending}
        onCancel={onCancel}
        submitLabel="Lưu thay đổi"
      />
    </form>
  )
}
