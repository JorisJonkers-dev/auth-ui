/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
const config = {
  // Stryker's `break` defaults to null, which means the mutation score never
  // fails the build -- so the required Mutation Tests check could only fail if
  // Stryker itself errored, not if the score collapsed. The floor sits below the
  // observed range, which lands between 63% and 68% depending on how many
  // mutants time out, so a regression fails while timeout variance does not.
  // Raise it as the score rises; never lower it to make a red build green.
  thresholds: { high: 80, low: 60, break: 58 },
  mutate: ['src/**/*.ts', '!src/**/*.test.ts'],
  // A zod schema, a route table or a config object is built when its module is
  // imported, so its mutants are static. With ignoreStatic and perTest, Stryker
  // attributes that module-load execution to whichever test happened to import
  // it first and runs only that one, so the schema tests never ran against the
  // schema mutants: loginSchema scored 0% and registerSchema 10.71% while both
  // had full line coverage. Running every test per mutant fixes the attribution
  // and costs about a minute for this repository.
  ignoreStatic: false,
  plugins: ['@stryker-mutator/vitest-runner'],
  testRunner: 'vitest',
  reporters: ['html', 'clear-text', 'progress'],
  coverageAnalysis: 'all',
  vitest: {
    configFile: 'vitest.config.ts',
  },
}

export default config
