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
    // 放宽 subject 大小写限制，允许 LLM/RAG/Ark/RTC/SSE 等专有缩写
    'subject-case': [0],
  },
};
