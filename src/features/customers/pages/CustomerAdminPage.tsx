import { useState, type FormEvent } from "react";

import { getErrorMessage } from "@/api/errors";
import type { AccountStatus } from "@/auth/types";
import { Button } from "@/shared/components/Button";
import { Card } from "@/shared/components/Card";
import { ConfirmationDialog } from "@/shared/components/ConfirmationDialog";
import {
  Alert,
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/shared/components/Feedback";
import { Field, Input, Select } from "@/shared/components/FormControls";
import { PageHeader } from "@/shared/components/PageHeader";
import { PaginationControls } from "@/shared/components/PaginationControls";
import { formatDateTime } from "@/shared/formatting/formatters";

import { CustomerStatusBadge } from "../components/CustomerStatusBadge";
import { InitialCustomerPasswordForm } from "../components/InitialCustomerPasswordForm";
import {
  useAdminCustomersQuery,
  useUpdateCustomerStatusMutation,
} from "../queries";
import type { AdminCustomer } from "../types";

const PAGE_SIZE = 20;

function CustomerAction({
  customer,
  disabled,
  loading,
  onChangeStatus,
  onSetInitialPassword,
  initialPasswordConfigured,
}: {
  customer: AdminCustomer;
  disabled: boolean;
  loading: boolean;
  onChangeStatus: (customer: AdminCustomer) => void;
  onSetInitialPassword: (customer: AdminCustomer) => void;
  initialPasswordConfigured: boolean;
}) {
  const locking = customer.status === "ACTIVE";

  return (
    <div className="flex flex-wrap justify-end gap-2">
      {customer.credentialCapabilities.canSetInitialPassword &&
      !initialPasswordConfigured ? (
        <Button
          disabled={disabled}
          onClick={() => onSetInitialPassword(customer)}
          variant="outline"
        >
          Đặt mật khẩu ban đầu
        </Button>
      ) : null}
      <Button
        disabled={disabled}
        loading={loading}
        onClick={() => onChangeStatus(customer)}
        variant={locking ? "danger" : "outline"}
      >
        {locking ? "Khóa tài khoản" : "Mở khóa"}
      </Button>
    </div>
  );
}

export function CustomerAdminPage() {
  const [draftSearch, setDraftSearch] = useState("");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"" | AccountStatus>("");
  const [initialPasswordCustomer, setInitialPasswordCustomer] =
    useState<AdminCustomer | null>(null);
  const [lockTarget, setLockTarget] = useState<AdminCustomer | null>(null);
  const [credentialSuccess, setCredentialSuccess] = useState<{
    customerId: string;
    message: string;
  } | null>(null);
  const customersQuery = useAdminCustomersQuery({
    limit: PAGE_SIZE,
    page,
    search: search || undefined,
    status: status || undefined,
  });
  const statusMutation = useUpdateCustomerStatusMutation();

  const applySearch = (event: FormEvent) => {
    event.preventDefault();
    setPage(1);
    setSearch(draftSearch.trim());
  };

  const updateStatus = (customer: AdminCustomer) => {
    if (statusMutation.isPending) {
      return;
    }

    statusMutation.mutate(
      {
        id: customer.id,
        status: customer.status === "ACTIVE" ? "LOCKED" : "ACTIVE",
      },
      {
        onSuccess: () => setLockTarget(null),
      },
    );
  };

  const changeStatus = (customer: AdminCustomer) => {
    if (customer.status === "ACTIVE") {
      statusMutation.reset();
      setLockTarget(customer);
      return;
    }

    updateStatus(customer);
  };

  return (
    <section className="mx-auto w-full max-w-7xl space-y-6">
      <PageHeader
        description="Tìm kiếm khách hàng và kiểm soát quyền truy cập tài khoản."
        eyebrow="Quản trị"
        title="Khách hàng"
      />

      <Card>
        <form
          className="grid gap-3 sm:grid-cols-[1fr_190px_auto] sm:items-end"
          onSubmit={applySearch}
        >
          <Field label="Tìm khách hàng">
            <Input
              aria-label="Tìm khách hàng"
              onChange={(event) => setDraftSearch(event.target.value)}
              placeholder="Tên, email hoặc số điện thoại"
              value={draftSearch}
            />
          </Field>
          <Field label="Trạng thái">
            <Select
              aria-label="Lọc theo trạng thái"
              onChange={(event) => {
                setPage(1);
                setStatus(event.target.value as "" | AccountStatus);
              }}
              value={status}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="LOCKED">Đã khóa</option>
            </Select>
          </Field>
          <Button type="submit">Tìm kiếm</Button>
        </form>
      </Card>

      {statusMutation.error && !lockTarget ? (
        <Alert title="Không thể cập nhật trạng thái" tone="error">
          {getErrorMessage(statusMutation.error)}
        </Alert>
      ) : null}

      <ConfirmationDialog
        busy={statusMutation.isPending}
        confirmLabel="Khóa tài khoản"
        description={
          lockTarget
            ? `${lockTarget.fullName} sẽ không thể đăng nhập cho tới khi được mở khóa.`
            : undefined
        }
        onCancel={() => {
          if (!statusMutation.isPending) {
            statusMutation.reset();
            setLockTarget(null);
          }
        }}
        onConfirm={() => {
          if (lockTarget) {
            updateStatus(lockTarget);
          }
        }}
        open={lockTarget !== null}
        title="Khóa tài khoản khách hàng?"
        tone="danger"
      >
        {statusMutation.isError ? (
          <Alert tone="error">{getErrorMessage(statusMutation.error)}</Alert>
        ) : null}
      </ConfirmationDialog>

      {credentialSuccess ? (
        <Alert title="Đã đặt mật khẩu ban đầu" tone="success">
          {credentialSuccess.message}
        </Alert>
      ) : null}

      {initialPasswordCustomer ? (
        <InitialCustomerPasswordForm
          customer={initialPasswordCustomer}
          onCancel={() => setInitialPasswordCustomer(null)}
          onSuccess={(customer) => {
            setCredentialSuccess({
              customerId: customer.id,
              message: `${customer.fullName} có thể dùng thông tin liên hệ để đăng nhập.`,
            });
            setInitialPasswordCustomer(null);
          }}
        />
      ) : null}

      {customersQuery.isPending ? (
        <LoadingState label="Đang tải danh sách khách hàng…" />
      ) : customersQuery.error ? (
        <ErrorState
          description={getErrorMessage(customersQuery.error)}
          onRetry={() => void customersQuery.refetch()}
        />
      ) : customersQuery.data.data.length === 0 ? (
        <EmptyState
          description="Hãy thử thay đổi từ khóa hoặc bộ lọc trạng thái."
          title="Không tìm thấy khách hàng"
        />
      ) : (
        <>
          <Card className="hidden overflow-hidden p-0 md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[54rem] text-left text-sm">
                <caption className="sr-only">
                  Danh sách tài khoản khách hàng
                </caption>
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-4" scope="col">
                      Khách hàng
                    </th>
                    <th className="px-5 py-4" scope="col">
                      Liên hệ
                    </th>
                    <th className="px-5 py-4" scope="col">
                      Trạng thái
                    </th>
                    <th className="px-5 py-4" scope="col">
                      Ngày tham gia
                    </th>
                    <th className="px-5 py-4 text-right" scope="col">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {customersQuery.data.data.map((customer) => (
                    <tr key={customer.id}>
                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-950">
                          {customer.fullName}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          #{customer.id}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-slate-700">
                        <p>{customer.phone}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {customer.email ?? "Chưa có email"}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <CustomerStatusBadge status={customer.status} />
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {formatDateTime(customer.createdAt)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <CustomerAction
                          customer={customer}
                          disabled={statusMutation.isPending}
                          loading={
                            statusMutation.isPending &&
                            statusMutation.variables?.id === customer.id
                          }
                          onChangeStatus={changeStatus}
                          initialPasswordConfigured={
                            credentialSuccess?.customerId === customer.id
                          }
                          onSetInitialPassword={(customer) => {
                            setCredentialSuccess(null);
                            setInitialPasswordCustomer(customer);
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="grid gap-4 md:hidden">
            {customersQuery.data.data.map((customer) => (
              <Card key={customer.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-black text-slate-950">
                      {customer.fullName}
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      #{customer.id}
                    </p>
                  </div>
                  <CustomerStatusBadge status={customer.status} />
                </div>
                <dl className="mt-4 grid gap-3 text-sm text-slate-700">
                  <div>
                    <dt className="text-xs text-slate-500">Số điện thoại</dt>
                    <dd className="mt-1 font-semibold">{customer.phone}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Email</dt>
                    <dd className="mt-1 font-semibold">
                      {customer.email ?? "Chưa có"}
                    </dd>
                  </div>
                </dl>
                <div className="mt-5">
                  <CustomerAction
                    customer={customer}
                    disabled={statusMutation.isPending}
                    loading={
                      statusMutation.isPending &&
                      statusMutation.variables?.id === customer.id
                    }
                    onChangeStatus={changeStatus}
                    initialPasswordConfigured={
                      credentialSuccess?.customerId === customer.id
                    }
                    onSetInitialPassword={(customer) => {
                      setCredentialSuccess(null);
                      setInitialPasswordCustomer(customer);
                    }}
                  />
                </div>
              </Card>
            ))}
          </div>

          <PaginationControls
            onPageChange={setPage}
            pagination={customersQuery.data.meta?.pagination}
          />
        </>
      )}
    </section>
  );
}
