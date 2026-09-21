import { z } from 'zod'

export const loginSchema = z.object({
  // The API resolves this against username and email, so the field cannot
  // claim to be a username.
  username: z.string().min(1, 'Username or email is required'),
  password: z.string().min(1, 'Password is required'),
})

export type LoginFormData = z.infer<typeof loginSchema>
