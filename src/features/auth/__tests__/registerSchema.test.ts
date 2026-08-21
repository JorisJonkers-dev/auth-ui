import { describe, expect, it } from 'vitest'
import { registerSchema } from '../schemas/registerSchema'

describe('registerSchema', () => {
  it('accepts valid registration data', () => {
    const result = registerSchema.safeParse({
      username: 'alice',
      email: 'alice@example.com',
      firstName: 'Alice',
      lastName: 'Smith',
      password: 'securepass123',
      confirmPassword: 'securepass123',
    })

    expect(result.success).toBe(true)
  })

  it('rejects mismatched passwords', () => {
    const result = registerSchema.safeParse({
      username: 'alice',
      email: 'alice@example.com',
      firstName: 'Alice',
      lastName: 'Smith',
      password: 'securepass123',
      confirmPassword: 'differentpass',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      const confirmError = result.error.issues.find((i) => i.path.includes('confirmPassword'))
      expect(confirmError).toBeDefined()
      expect(confirmError?.message).toBe('Passwords do not match')
    }
  })

  it('rejects invalid email', () => {
    const result = registerSchema.safeParse({
      username: 'alice',
      email: 'not-an-email',
      firstName: 'Alice',
      lastName: 'Smith',
      password: 'securepass123',
      confirmPassword: 'securepass123',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      const emailError = result.error.issues.find((i) => i.path.includes('email'))
      expect(emailError).toBeDefined()
    }
  })

  it('rejects short password', () => {
    const result = registerSchema.safeParse({
      username: 'alice',
      email: 'alice@example.com',
      firstName: 'Alice',
      lastName: 'Smith',
      password: 'short',
      confirmPassword: 'short',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      const passwordError = result.error.issues.find((i) => i.path.includes('password'))
      expect(passwordError).toBeDefined()
    }
  })
  // Every bound below was free to move: the existing cases use values well
  // inside the allowed range, so shifting a limit by one changed nothing that
  // was asserted. These sit exactly on each boundary.
  function valid(overrides: Record<string, string> = {}): Record<string, string> {
    return {
      username: 'alice',
      email: 'alice@example.com',
      firstName: 'Alice',
      lastName: 'Smith',
      password: 'securepass123',
      confirmPassword: 'securepass123',
      ...overrides,
    }
  }

  function messageFor(data: Record<string, string>, field: string): string | undefined {
    const result = registerSchema.safeParse(data)
    if (result.success) return undefined
    return result.error.issues.find((i) => i.path.includes(field))?.message
  }

  it('accepts a username of exactly the minimum length', () => {
    expect(registerSchema.safeParse(valid({ username: 'abc' })).success).toBe(true)
  })

  it('rejects a username one character short, with the message the form renders', () => {
    expect(messageFor(valid({ username: 'ab' }), 'username')).toBe(
      'Username must be at least 3 characters',
    )
  })

  it('accepts a username of exactly the maximum length', () => {
    expect(registerSchema.safeParse(valid({ username: 'a'.repeat(50) })).success).toBe(true)
  })

  it('rejects a username one character too long', () => {
    expect(messageFor(valid({ username: 'a'.repeat(51) }), 'username')).toBe(
      'Username must be at most 50 characters',
    )
  })

  it('accepts the full permitted username character set', () => {
    expect(registerSchema.safeParse(valid({ username: 'a-Z_09' })).success).toBe(true)
  })

  it.each(['has space', 'has.dot', 'has+plus', 'hasé', 'has/slash'])(
    'rejects the username %j as outside the permitted character set',
    (username) => {
      expect(messageFor(valid({ username }), 'username')).toBe(
        'Username may only contain letters, digits, underscores, and hyphens',
      )
    },
  )

  it('accepts a password of exactly the minimum length', () => {
    const password = 'a'.repeat(8)
    expect(registerSchema.safeParse(valid({ password, confirmPassword: password })).success).toBe(
      true,
    )
  })

  it('rejects a password one character short, with the message the form renders', () => {
    // A weakened minimum is the mutation here that matters most.
    const password = 'a'.repeat(7)
    expect(messageFor(valid({ password, confirmPassword: password }), 'password')).toBe(
      'Password must be at least 8 characters',
    )
  })

  it.each([
    ['firstName', 'First name is required'],
    ['lastName', 'Last name is required'],
  ])('rejects an empty %s', (field, message) => {
    expect(messageFor(valid({ [field]: '' }), field)).toBe(message)
  })

  it.each(['firstName', 'lastName'])('accepts a %s of exactly the maximum length', (field) => {
    expect(registerSchema.safeParse(valid({ [field]: 'a'.repeat(100) })).success).toBe(true)
  })

  it.each(['firstName', 'lastName'])('rejects a %s one character too long', (field) => {
    expect(registerSchema.safeParse(valid({ [field]: 'a'.repeat(101) })).success).toBe(false)
  })

  it('reports the mismatch against confirmPassword rather than password', () => {
    // The form renders the error under the confirmation field; a changed path
    // would leave the message with nowhere to appear.
    const result = registerSchema.safeParse(valid({ confirmPassword: 'different' }))

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.join('.') === 'confirmPassword')).toBe(true)
    }
  })

  it('accepts passwords that match exactly', () => {
    expect(registerSchema.safeParse(valid()).success).toBe(true)
  })
})
