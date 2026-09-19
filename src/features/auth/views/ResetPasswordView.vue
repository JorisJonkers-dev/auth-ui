<script setup lang="ts">
import type { ResetPasswordFormData } from '../schemas/passwordResetSchema'
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { resetPasswordSchema } from '../schemas/passwordResetSchema'
import { resetPassword } from '../services/authService'

const route = useRoute()
const token = typeof route.query.token === 'string' ? route.query.token : ''

const form = ref<ResetPasswordFormData>({ newPassword: '', confirmPassword: '' })
const fieldErrors = ref<Partial<Record<keyof ResetPasswordFormData, string>>>({})
const submitting = ref(false)
const done = ref(false)
const submitError = ref('')

function validate(): boolean {
  const result = resetPasswordSchema.safeParse(form.value)
  if (result.success) {
    fieldErrors.value = {}
    return true
  }
  const mapped: Partial<Record<string, string>> = {}
  for (const issue of result.error.issues) {
    const key = String(issue.path[0])
    if (key) mapped[key] = issue.message
  }
  fieldErrors.value = mapped
  return false
}

async function onSubmit(): Promise<void> {
  if (submitting.value || !token || !validate()) return
  submitting.value = true
  submitError.value = ''
  try {
    await resetPassword(token, form.value.newPassword)
    done.value = true
  } catch {
    submitError.value = 'This reset link is invalid or has expired. Request a new one.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div
    class="flex min-h-dvh items-center justify-center bg-surface-dark px-4 py-[max(1.5rem,env(safe-area-inset-top))]"
  >
    <form
      class="w-full max-w-md space-y-5 rounded-xl border border-surface-border bg-surface-card p-8"
      @submit.prevent="onSubmit"
    >
      <!-- Terminal-style header -->
      <div class="flex items-center gap-2">
        <div class="flex gap-1.5">
          <div class="h-2.5 w-2.5 rounded-full bg-red-500/60" />
          <div class="h-2.5 w-2.5 rounded-full bg-terminal-amber/60" />
          <div class="h-2.5 w-2.5 rounded-full bg-terminal-green/60" />
        </div>
        <span class="font-mono text-xs text-[var(--color-text-subtle)]">
          ~/auth/reset-password
        </span>
      </div>

      <h1 class="text-2xl font-bold text-[var(--color-text-primary)]">Set a new password</h1>

      <!-- Missing token: the link was not opened from the email -->
      <template v-if="!token">
        <p class="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          No reset token provided. Open the link from your password reset email.
        </p>
        <router-link
          class="glow-accent block w-full rounded-md bg-accent px-4 py-2 text-center font-mono text-sm font-semibold text-white transition-colors hover:bg-accent-light"
          to="/forgot-password"
        >
          Request a new link
        </router-link>
      </template>

      <template v-else-if="done">
        <p
          class="rounded-md border border-terminal-green/20 bg-terminal-green/10 px-3 py-2 text-sm text-terminal-green"
        >
          Your password has been reset. You can now sign in.
        </p>
        <router-link
          class="glow-accent block w-full rounded-md bg-accent px-4 py-2 text-center font-mono text-sm font-semibold text-white transition-colors hover:bg-accent-light"
          to="/login"
        >
          Sign in
        </router-link>
      </template>

      <template v-else>
        <div>
          <label
            class="block font-mono text-xs font-medium text-[var(--color-text-muted)]"
            for="new-password"
          >
            New password
          </label>
          <input
            id="new-password"
            v-model="form.newPassword"
            autocomplete="new-password"
            class="mt-1 block w-full rounded-md border border-surface-border bg-surface-elevated px-3 py-2 font-mono text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-subtle)] focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            placeholder="••••••••"
            type="password"
          />
          <p v-if="fieldErrors.newPassword" class="mt-1 text-sm text-red-400">
            {{ fieldErrors.newPassword }}
          </p>
        </div>

        <div>
          <label
            class="block font-mono text-xs font-medium text-[var(--color-text-muted)]"
            for="confirm-password"
          >
            Confirm password
          </label>
          <input
            id="confirm-password"
            v-model="form.confirmPassword"
            autocomplete="new-password"
            class="mt-1 block w-full rounded-md border border-surface-border bg-surface-elevated px-3 py-2 font-mono text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-subtle)] focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            placeholder="••••••••"
            type="password"
          />
          <p v-if="fieldErrors.confirmPassword" class="mt-1 text-sm text-red-400">
            {{ fieldErrors.confirmPassword }}
          </p>
        </div>

        <p
          v-if="submitError"
          class="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400"
        >
          {{ submitError }}
        </p>

        <button
          :disabled="submitting"
          class="glow-accent w-full rounded-md bg-accent px-4 py-2 font-mono text-sm font-semibold text-white transition-colors hover:bg-accent-light disabled:opacity-50"
          type="submit"
        >
          {{ submitting ? 'Saving...' : 'Reset password' }}
        </button>
      </template>

      <p class="text-center text-sm text-[var(--color-text-muted)]">
        <router-link class="font-medium text-accent-light hover:underline" to="/login">
          Back to login
        </router-link>
      </p>
    </form>
  </div>
</template>
