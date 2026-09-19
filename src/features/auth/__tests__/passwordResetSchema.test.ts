import { describe, expect, it } from 'vitest'
import { forgotPasswordSchema, resetPasswordSchema } from '../schemas/passwordResetSchema'

describe('forgotPasswordSchema', () => {
  it('accepts a valid email', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'bob@example.com' }).success).toBe(true)
  })

  it('rejects a malformed email', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'bob' }).success).toBe(false)
  })
})

describe('resetPasswordSchema', () => {
  it('accepts matching passwords of at least 8 characters', () => {
    const result = resetPasswordSchema.safeParse({
      newPassword: 'pass1234',
      confirmPassword: 'pass1234',
    })
    expect(result.success).toBe(true)
  })

  it('rejects a short password', () => {
    const result = resetPasswordSchema.safeParse({
      newPassword: 'pass123',
      confirmPassword: 'pass123',
    })
    expect(result.success).toBe(false)
  })

  it('reports the mismatch on confirmPassword', () => {
    const result = resetPasswordSchema.safeParse({
      newPassword: 'pass1234',
      confirmPassword: 'pass5678',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(['confirmPassword'])
    }
  })
})
