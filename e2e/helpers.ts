import type { Page, Route } from '@playwright/test'

type ActorType = 'customer' | 'user'
type Role = 'ADMIN' | 'STAFF'

interface AuthActor {
  actorType: ActorType
  role?: Role
}

export function envelope(data: unknown, path: string, statusCode = 200) {
  return {
    data,
    message: 'OK',
    path,
    requestId: 'req-e2e',
    statusCode,
    success: true,
    timestamp: '2026-07-24T00:00:00.000Z',
  }
}

export function dashboardSummary(from: string, to: string) {
  return {
    bookings: {
      cancelled: 1,
      checkedIn: 2,
      checkedOut: 3,
      confirmed: 4,
      pendingPayment: 5,
    },
    fromDate: from,
    generatedAt: '2026-07-29T04:00:00.000Z',
    occupancy: {
      occupancyRate: 62.5,
      roomNightsAvailable: 40,
      roomNightsReserved: 25,
    },
    payments: {
      refundPending: 1,
      requiresReview: 2,
    },
    revenue: {
      manual: 500_000,
      total: 2_000_000,
      vnpay: 1_500_000,
    },
    rooms: {
      cleaning: 1,
      maintenance: 1,
      occupied: 3,
      ready: 7,
    },
    toDate: to,
    totalRefunded: 200_000,
  }
}

export async function fulfillJson(
  route: Route,
  data: unknown,
  path: string,
  status = 200,
) {
  await route.fulfill({
    body: JSON.stringify(envelope(data, path, status)),
    contentType: 'application/json',
    status,
  })
}

export function principalFor(actor: AuthActor) {
  const account = {
    createdAt: '2026-07-24T00:00:00.000Z',
    fullName:
      actor.actorType === 'customer'
        ? 'Khách kiểm thử'
        : 'Nhân viên kiểm thử',
    id: actor.actorType === 'customer' ? '101' : '201',
    phone: '+84900000000',
    status: 'ACTIVE',
    updatedAt: '2026-07-24T00:00:00.000Z',
  }

  return actor.actorType === 'customer'
    ? {
        actorType: 'customer' as const,
        ...account,
        email: 'customer@example.com',
      }
    : {
        actorType: 'user' as const,
        ...account,
        email: 'staff@example.com',
        role: actor.role ?? 'STAFF',
      }
}

export async function installSession(page: Page, actor: AuthActor) {
  const principal = principalFor(actor)

  await page.addInitScript(
    ({ storedPrincipal }) => {
      window.sessionStorage.setItem(
        'hbms.auth.session.v1',
        JSON.stringify({
          session: {
            accessToken: 'e2e-access-token',
            expiresAt: Date.now() + 3_600_000,
            persistence: 'session',
            principal: storedPrincipal,
            tokenType: 'Bearer',
          },
          version: 1,
        }),
      )
    },
    { storedPrincipal: principal },
  )

  await page.route('**/api/v1/auth/me', async (route) => {
    const data =
      principal.actorType === 'customer'
        ? {
            actorType: 'customer',
            customer: {
              createdAt: principal.createdAt,
              email: principal.email,
              fullName: principal.fullName,
              id: principal.id,
              phone: principal.phone,
              status: principal.status,
              updatedAt: principal.updatedAt,
            },
          }
        : {
            actorType: 'user',
            user: {
              createdAt: principal.createdAt,
              email: principal.email,
              fullName: principal.fullName,
              id: principal.id,
              phone: principal.phone,
              role: principal.role,
              status: principal.status,
              updatedAt: principal.updatedAt,
            },
          }

    await fulfillJson(route, data, '/api/v1/auth/me')
  })
}
