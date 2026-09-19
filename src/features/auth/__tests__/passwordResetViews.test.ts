import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createRouter, createWebHashHistory } from 'vue-router'

import ForgotPasswordView from '../views/ForgotPasswordView.vue'
import ResetPasswordView from '../views/ResetPasswordView.vue'

const mockForgotPassword = vi.fn()
const mockResetPassword = vi.fn()

vi.mock('../services/authService', () => ({
  forgotPassword: (...args: unknown[]) => mockForgotPassword(...args),
  resetPassword: (...args: unknown[]) => mockResetPassword(...args),
}))

function createTestRouter() {
  return createRouter({
    history: createWebHashHistory(),
    routes: [
      { path: '/', component: { template: '<div/>' } },
      { path: '/login', name: 'login', component: { template: '<div/>' } },
      {
        path: '/forgot-password',
        name: 'forgot-password',
        component: { template: '<div/>' },
      },
      {
        path: '/reset-password',
        name: 'reset-password',
        component: { template: '<div/>' },
      },
    ],
  })
}

async function mountAt<T>(component: T, path: string) {
  const router = createTestRouter()
  await router.push(path)
  await router.isReady()
  return mount(component as never, { global: { plugins: [router] } })
}

describe('forgotPasswordView', () => {
  beforeEach(() => {
    mockForgotPassword.mockReset()
  })

  it('sends the reset link and shows the neutral confirmation', async () => {
    mockForgotPassword.mockResolvedValue({ message: 'ok' })
    const wrapper = await mountAt(ForgotPasswordView, '/forgot-password')

    await wrapper.find('input[type="email"]').setValue('bob@example.com')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(mockForgotPassword).toHaveBeenCalledWith('bob@example.com')
    expect(wrapper.text()).toContain('If an account with that email exists')
  })

  it('rejects an invalid email without calling the API', async () => {
    const wrapper = await mountAt(ForgotPasswordView, '/forgot-password')

    await wrapper.find('input[type="email"]').setValue('not-an-email')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(mockForgotPassword).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Must be a valid email address')
  })

  it('surfaces a request failure', async () => {
    mockForgotPassword.mockRejectedValue(new Error('boom'))
    const wrapper = await mountAt(ForgotPasswordView, '/forgot-password')

    await wrapper.find('input[type="email"]').setValue('bob@example.com')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Could not send the reset link')
  })
})

describe('resetPasswordView', () => {
  beforeEach(() => {
    mockResetPassword.mockReset()
  })

  it('resets the password with the token from the query string', async () => {
    mockResetPassword.mockResolvedValue({ message: 'ok' })
    const wrapper = await mountAt(ResetPasswordView, '/reset-password?token=abc-123')

    await wrapper.find('#new-password').setValue('new-password-1')
    await wrapper.find('#confirm-password').setValue('new-password-1')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(mockResetPassword).toHaveBeenCalledWith('abc-123', 'new-password-1')
    expect(wrapper.text()).toContain('Your password has been reset')
  })

  it('reports mismatched passwords without calling the API', async () => {
    const wrapper = await mountAt(ResetPasswordView, '/reset-password?token=abc-123')

    await wrapper.find('#new-password').setValue('new-password-1')
    await wrapper.find('#confirm-password').setValue('new-password-2')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(mockResetPassword).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Passwords do not match')
  })

  it('asks for a new link when the token is missing', async () => {
    const wrapper = await mountAt(ResetPasswordView, '/reset-password')

    expect(wrapper.text()).toContain('No reset token provided')
    expect(wrapper.find('#new-password').exists()).toBe(false)
  })

  it('explains an expired token', async () => {
    mockResetPassword.mockRejectedValue(new Error('expired'))
    const wrapper = await mountAt(ResetPasswordView, '/reset-password?token=stale')

    await wrapper.find('#new-password').setValue('new-password-1')
    await wrapper.find('#confirm-password').setValue('new-password-1')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('invalid or has expired')
  })
})
