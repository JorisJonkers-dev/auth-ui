/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
const config = {
  // Stryker's `break` defaults to null, which means the mutation score never
  // fails the build -- so the required Mutation Tests check could only fail if
  // Stryker itself errored, not if the score collapsed. The floor is set just
  // under the current score (51.00% over ~163 mutants) so it catches a
  // regression without demanding an immediate improvement. Raise it as the
  // score rises; never lower it to make a red build green.
  thresholds: { high: 80, low: 60, break: 48 },
  mutate: ['src/**/*.ts', '!src/**/*.test.ts'],
  ignoreStatic: true,
  plugins: ['@stryker-mutator/vitest-runner'],
  testRunner: 'vitest',
  reporters: ['html', 'clear-text', 'progress'],
  coverageAnalysis: 'perTest',
  vitest: {
    configFile: 'vitest.config.ts',
  },
}

export default config
