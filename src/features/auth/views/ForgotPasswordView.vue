<script setup lang="ts">
import { ref } from 'vue'
import { forgotPasswordSchema } from '../schemas/passwordResetSchema'
import { forgotPassword } from '../services/authService'

const email = ref('')
const emailError = ref('')
const submitting = ref(false)
const sent = ref(false)
const submitError = ref('')

function validate(): boolean {
  const result = forgotPasswordSchema.safeParse({ email: email.value })
  emailError.value = result.success ? '' : (result.error.issues[0]?.message ?? 'Invalid email')
  return result.success
}

async function onSubmit(): Promise<void> {
  if (submitting.value || !validate()) return
  submitting.value = true
  submitError.value = ''
  try {
    await forgotPassword(email.value)
    sent.value = true
  } catch {
    submitError.value = 'Could not send the reset link. Please try again.'
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
          ~/auth/forgot-password
        </span>
      </div>

      <h1 class="text-2xl font-bold text-[var(--color-text-primary)]">Forgot password</h1>

      <template v-if="sent">
        <p
          class="rounded-md border border-terminal-green/20 bg-terminal-green/10 px-3 py-2 text-sm text-terminal-green"
        >
          If an account with that email exists, a password reset link has been sent.
        </p>
        <p class="text-sm text-[var(--color-text-muted)]">
          The link expires in 1 hour. Check your inbox and spam folder.
        </p>
      </template>

      <template v-else>
        <p class="text-sm text-[var(--color-text-muted)]">
          Enter your email and we'll send you a link to set a new password.
        </p>

        <div>
          <label
            class="block font-mono text-xs font-medium text-[var(--color-text-muted)]"
            for="email"
          >
            Email
          </label>
          <input
            id="email"
            v-model="email"
            autocomplete="email"
            class="mt-1 block w-full rounded-md border border-surface-border bg-surface-elevated px-3 py-2 font-mono text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-subtle)] focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            placeholder="you@example.com"
            type="email"
          />
          <p v-if="emailError" class="mt-1 text-sm text-red-400">{{ emailError }}</p>
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
          {{ submitting ? 'Sending...' : 'Send reset link' }}
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
