export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat', 'fix', 'docs', 'refactor', 'chore',
        'style', 'test', 'build', 'perf', 'ci', 'revert',
      ],
    ],
    'subject-case': [2, 'always', 'lower-case'],
  },
};
