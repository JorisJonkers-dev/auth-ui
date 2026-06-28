import { beforeEach, describe, expect, it, vi } from 'vitest'

const clientMocks = vi.hoisted(() => ({
  register: vi.fn(),
  sessionLogin: vi.fn(),
  confirmEmail: vi.fn(),
  resendConfirmation: vi.fn(),
  enroll: vi.fn(),
  verify: vi.fn(),
}))

vi.mock('@jorisjonkers-dev/auth-api-client', () => clientMocks)

vi.mock('@/lib/vueWebCommons', () => ({
  useAuth: () => ({
    getCsrfToken: () => 'fake-csrf-token',
    setUser: vi.fn(),
    fetchUser: vi.fn().mockResolvedValue(null),
    logout: vi.fn(),
    user: null,
    isAuthenticated: false,
  }),
}))

const authService = await import('../services/authService')
const {
  register,
  sessionLogin,
  confirmEmail,
  resendConfirmation,
  enrollTotp,
  verifyTotp,
} = authService

function ok<T>(data: T): { data: T; error: undefined } {
  return { data, error: undefined }
}

function fail(error: unknown): { data: undefined; error: unknown } {
  return { data: undefined, error }
}

const commonOptions = {
  baseUrl: '',
  credentials: 'include',
  headers: { 'X-XSRF-TOKEN': 'fake-csrf-token' },
}

describe('authService', () => {
  beforeEach(() => {
    for (const mock of Object.values(clientMocks)) {
      mock.mockReset()
    }
  })

  it('register sends registration data', async () => {
    clientMocks.register.mockResolvedValue(ok({ id: '1' }))

    await register({
      username: 'bob',
      email: 'bob@example.com',
      firstName: 'Test',
      lastName: 'User',
      password: 'pass1234',
    })

    expect(clientMocks.register).toHaveBeenCalledWith({
      ...commonOptions,
      body: {
        username: 'bob',
        email: 'bob@example.com',
        firstName: 'Test',
        lastName: 'User',
        password: 'pass1234',
      },
    })
  })

  it('sessionLogin sends credentials with cookies include', async () => {
    const responseData = { success: true, totpRequired: false }
    clientMocks.sessionLogin.mockResolvedValue(ok(responseData))

    await sessionLogin('alice', 'secret')

    expect(clientMocks.sessionLogin).toHaveBeenCalledWith({
      ...commonOptions,
      body: { username: 'alice', password: 'secret' },
    })
  })

  it('sessionLogin returns totpRequired when needed', async () => {
    const responseData = { success: false, totpRequired: true }
    clientMocks.sessionLogin.mockResolvedValue(ok(responseData))

    const result = await sessionLogin('alice', 'secret')

    expect(result.totpRequired).toBe(true)
  })

  it('sessionLogin rejects malformed client responses', async () => {
    clientMocks.sessionLogin.mockResolvedValue(
      ok({ success: 'yes', totpRequired: false }),
    )

    await expect(sessionLogin('alice', 'secret')).rejects.toThrow()
  })

  it('confirmEmail calls GET with token parameter', async () => {
    clientMocks.confirmEmail.mockResolvedValue(
      ok({ message: 'Email confirmed' }),
    )

    const result = await confirmEmail('abc-123')

    expect(clientMocks.confirmEmail).toHaveBeenCalledWith({
      ...commonOptions,
      query: { token: 'abc-123' },
    })
    expect(result.message).toBe('Email confirmed')
  })

  it('resendConfirmation sends email via POST', async () => {
    clientMocks.resendConfirmation.mockResolvedValue(
      ok({ message: 'Confirmation sent' }),
    )

    const result = await resendConfirmation('alice@example.com')

    expect(clientMocks.resendConfirmation).toHaveBeenCalledWith({
      ...commonOptions,
      body: { email: 'alice@example.com' },
    })
    expect(result.message).toBe('Confirmation sent')
  })

  it('enrollTotp sends authenticated POST with CSRF header', async () => {
    const responseData = { secret: 'ABCDEF', qrUri: 'otpauth://totp/test' }
    clientMocks.enroll.mockResolvedValue(ok(responseData))

    const result = await enrollTotp()

    expect(clientMocks.enroll).toHaveBeenCalledWith(commonOptions)
    expect(result.secret).toBe('ABCDEF')
  })

  it('enrollTotp rejects malformed client responses', async () => {
    clientMocks.enroll.mockResolvedValue(ok({ secret: 'ABCDEF' }))

    await expect(enrollTotp()).rejects.toThrow()
  })

  it('verifyTotp sends authenticated POST with CSRF header and code', async () => {
    clientMocks.verify.mockResolvedValue(ok(undefined))

    await verifyTotp('654321')

    expect(clientMocks.verify).toHaveBeenCalledWith({
      ...commonOptions,
      body: { code: '654321' },
    })
  })

  it('sessionLogin includes totpCode when provided', async () => {
    const responseData = { success: true, totpRequired: false }
    clientMocks.sessionLogin.mockResolvedValue(ok(responseData))

    await sessionLogin('alice', 'secret', '123456')

    expect(clientMocks.sessionLogin).toHaveBeenCalledWith({
      ...commonOptions,
      body: { username: 'alice', password: 'secret', totpCode: '123456' },
    })
  })

  it('sessionLogin throws on client error', async () => {
    const errorData = { title: 'Unauthorized', status: 401 }
    clientMocks.sessionLogin.mockResolvedValue(fail(errorData))

    await expect(sessionLogin('alice', 'wrong')).rejects.toEqual(errorData)
  })

  it('confirmEmail throws on client error', async () => {
    const errorData = { title: 'Gone', status: 410 }
    clientMocks.confirmEmail.mockResolvedValue(fail(errorData))

    await expect(confirmEmail('expired-token')).rejects.toEqual(errorData)
  })

  it('register throws on client error', async () => {
    const errorData = {
      title: 'Bad Request',
      status: 400,
      detail: 'Invalid input',
    }
    clientMocks.register.mockResolvedValue(fail(errorData))

    await expect(
      register({
        username: 'x',
        email: 'x@x.com',
        firstName: 'Test',
        lastName: 'User',
        password: 'y',
      }),
    ).rejects.toEqual(errorData)
  })
})
