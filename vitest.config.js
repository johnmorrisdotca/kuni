// The shared documentation-site tests build every entry point to measure its size; with the country data that takes longer than vitest's five seconds on a slow runner.
export default { test: { testTimeout: 30000 } };
