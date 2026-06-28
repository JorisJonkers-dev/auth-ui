import {
  confirmEmail as confirmEmailRequest,
  enroll as enrollTotpRequest,
  register as registerRequest,
  resendConfirmation as resendConfirmationRequest,
  sessionLogin as sessionLoginRequest,
  verify as verifyTotpRequest,
  type RegisterUserRequest,
  type SessionLoginResponse as ApiSessionLoginResponse,
  type TotpEnrollResponse,
} from '@jorisjonkers-dev/auth-api-client'
import { useAuth } from '@/lib/vueWebCommons'

type RegisterData = RegisterUserRequest
type MessageResponse = { message: string }
type ClientResult<T> =
  | { data: T; error: undefined }
  | { data: undefined; error: unknown }

function getCsrfToken(): string | null {
  const { getCsrfToken: csrf } = useAuth()
  return csrf()
}

function apiOptions(): { baseUrl: string; credentials: RequestCredentials; headers: Record<string, string> } {
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

/* eslint-disable ts/consistent-type-assertions -- generated client result narrows by convention */
async function unwrap<T>(result: Promise<ClientResult<T>>): Promise<T> {
  const response = await result
  if (response.error !== undefined) {
    throw response.error
  }
  return response.data as T
}
/* eslint-enable ts/consistent-type-assertions */

function toMessageResponse(data: Record<string, string>): MessageResponse {
  return { message: data.message ?? '' }
}

export async function register(data: RegisterData): Promise<void> {
  await unwrap(registerRequest({ ...apiOptions(), body: data }))
}

export async function enrollTotp(): Promise<TotpEnrollResponse> {
  return unwrap(enrollTotpRequest(apiOptions()))
}

export async function verifyTotp(code: string): Promise<void> {
  await unwrap(verifyTotpRequest({ ...apiOptions(), body: { code } }))
}

export async function confirmEmail(token: string): Promise<MessageResponse> {
  const data = await unwrap(confirmEmailRequest({ ...apiOptions(), query: { token } }))
  return toMessageResponse(data)
}

export async function resendConfirmation(email: string): Promise<MessageResponse> {
  const data = await unwrap(resendConfirmationRequest({ ...apiOptions(), body: { email } }))
  return toMessageResponse(data)
}

export type SessionLoginResponse = ApiSessionLoginResponse

/**
 * Authenticates the user and creates a server-side session (SESSION cookie).
 * The session cookie is used for all subsequent authenticated requests.
 */
export async function sessionLogin(
  username: string,
  password: string,
  totpCode?: string,
): Promise<SessionLoginResponse> {
  return unwrap(sessionLoginRequest({ ...apiOptions(), body: { username, password, ...(totpCode ? { totpCode } : {}) } }))
}
