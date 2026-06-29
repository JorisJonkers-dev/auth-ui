import type { RegisterUserRequest } from '@jorisjonkers-dev/auth-api-client'
import {
  confirmEmail as confirmEmailRequest,
  enroll as enrollTotpRequest,
  register as registerRequest,
  resendConfirmation as resendConfirmationRequest,
  sessionLogin as sessionLoginRequest,
  verify as verifyTotpRequest,
} from '@jorisjonkers-dev/auth-api-client'
import { z } from 'zod'
import { useAuth } from '@/lib/vueWebCommons'

type RegisterData = RegisterUserRequest
interface ClientResult<T> {
  data: T | undefined
  error: unknown | undefined
}

const messageResponseSchema = z
  .record(z.string(), z.string())
  .transform((data) => ({
    message: data.message ?? '',
  }))

const totpEnrollResponseSchema = z.object({
  qrUri: z.string(),
  secret: z.string(),
})

const sessionUserResponseSchema = z.object({
  email: z.string().optional(),
  firstName: z.string().optional(),
  id: z.string(),
  lastName: z.string().optional(),
  role: z.string(),
  roles: z.array(z.string()).optional(),
  username: z.string(),
})

const sessionLoginResponseSchema = z.object({
  success: z.boolean(),
  totpRequired: z.boolean(),
  user: sessionUserResponseSchema.nullish(),
})

type MessageResponse = z.infer<typeof messageResponseSchema>
type TotpEnrollResponse = z.infer<typeof totpEnrollResponseSchema>
export type SessionLoginResponse = z.infer<typeof sessionLoginResponseSchema>

function getCsrfToken(): string | null {
  const { getCsrfToken: csrf } = useAuth()
  return csrf()
}

function apiOptions(): {
  baseUrl: string
  credentials: RequestCredentials
  headers: Record<string, string>
} {
  const headers: Record<string, string> = {}
  const csrf = getCsrfToken()
  if (csrf) {
    headers['X-XSRF-TOKEN'] = csrf
  }

  return {
    baseUrl: '',
    credentials: 'include',
    headers,
  }
}

async function unwrap<T>(result: Promise<ClientResult<T>>): Promise<NonNullable<T>> {
  const response = await result
  if (response.error !== undefined) {
    throw response.error
  }
  if (response.data == null) {
    throw new Error('Missing response body')
  }
  return response.data
}

async function unwrapVoid(result: Promise<ClientResult<unknown>>): Promise<void> {
  const response = await result
  if (response.error !== undefined) {
    throw response.error
  }
}

export async function register(data: RegisterData): Promise<void> {
  await unwrapVoid(registerRequest({ ...apiOptions(), body: data }))
}

export async function enrollTotp(): Promise<TotpEnrollResponse> {
  const data = await unwrap(enrollTotpRequest(apiOptions()))
  return totpEnrollResponseSchema.parse(data)
}

export async function verifyTotp(code: string): Promise<void> {
  await unwrapVoid(verifyTotpRequest({ ...apiOptions(), body: { code } }))
}

export async function confirmEmail(token: string): Promise<MessageResponse> {
  const data = await unwrap(
    confirmEmailRequest({ ...apiOptions(), query: { token } }),
  )
  return messageResponseSchema.parse(data)
}

export async function resendConfirmation(
  email: string,
): Promise<MessageResponse> {
  const data = await unwrap(
    resendConfirmationRequest({ ...apiOptions(), body: { email } }),
  )
  return messageResponseSchema.parse(data)
}

/**
 * Authenticates the user and creates a server-side session (SESSION cookie).
 * The session cookie is used for all subsequent authenticated requests.
 */
export async function sessionLogin(
  username: string,
  password: string,
  totpCode?: string,
): Promise<SessionLoginResponse> {
  const data = await unwrap(
    sessionLoginRequest({
      ...apiOptions(),
      body: { username, password, ...(totpCode ? { totpCode } : {}) },
    }),
  )
  return sessionLoginResponseSchema.parse(data)
}
