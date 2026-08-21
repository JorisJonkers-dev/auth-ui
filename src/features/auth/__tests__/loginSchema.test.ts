import { describe, expect, it } from 'vitest'
import { loginSchema } from '../schemas/loginSchema'

describe('loginSchema', () => {
  it('accepts valid login data', () => {
    const result = loginSchema.safeParse({
      username: 'alice',
      password: 'secret123',
    })

    expect(result.success).toBe(true)
  })

  it('rejects empty username', () => {
    const result = loginSchema.safeParse({
      username: '',
      password: 'secret123',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      const usernameError = result.error.issues.find((i) => i.path.includes('username'))
      expect(usernameError).toBeDefined()
    }
  })

  it('rejects empty password', () => {
    const result = loginSchema.safeParse({
      username: 'alice',
      password: '',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      const passwordError = result.error.issues.find((i) => i.path.includes('password'))
      expect(passwordError).toBeDefined()
    }
  })
  // The existing cases use a representative username and an empty one, which
  // leaves every bound free to move: min(1) -> min(2) still rejects '' and
  // still accepts 'alice'. Only a value sitting exactly on the boundary pins it.
  it('accepts a single-character username, which is the shortest the rule allows', () => {
    const result = loginSchema.safeParse({ username: 'a', password: 'secret123' })

    expect(result.success).toBe(true)
  })

  it('accepts a single-character password', () => {
    const result = loginSchema.safeParse({ username: 'alice', password: 'x' })

    expect(result.success).toBe(true)
  })

  it('reports the username message the form renders', () => {
    // The form shows this string, so a changed literal is a user-visible change.
    const result = loginSchema.safeParse({ username: '', password: 'secret123' })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.find((i) => i.path.includes('username'))?.message).toBe(
        'Username is required',
      )
    }
  })

  it('reports the password message the form renders', () => {
    const result = loginSchema.safeParse({ username: 'alice', password: '' })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.find((i) => i.path.includes('password'))?.message).toBe(
        'Password is required',
      )
    }
  })

  it('rejects a payload missing its fields entirely', () => {
    expect(loginSchema.safeParse({}).success).toBe(false)
  })
})
