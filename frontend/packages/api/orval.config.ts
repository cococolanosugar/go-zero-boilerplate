import { defineConfig } from 'orval';

export default defineConfig({
  gateway: {
    input: {
      target: '../../../manifest/openapi/openapi.json',
      unsafeDisableValidation: true,
    },
    output: {
      mode: 'tags-split',
      target: './src/endpoints',
      schemas: './src/model',
      client: 'axios-functions',
      clean: true,
      override: {
        mutator: {
          path: './src/custom-instance.ts',
          name: 'customInstance',
        },
      },
    },
  },
});
