import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
        ecmaVersion: 'latest'
      }
    }
  },
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    rules: {
      '@typescript-eslint/class-methods-use-this': 'warn',
      '@typescript-eslint/consistent-return': 'warn',
      '@typescript-eslint/consistent-type-exports': 'warn',
      '@typescript-eslint/consistent-type-imports': 'warn',
      '@typescript-eslint/default-param-last': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/explicit-member-accessibility': 'warn',
      '@typescript-eslint/explicit-module-boundary-types': 'warn',
      '@typescript-eslint/init-declarations': 'warn',
      //"@typescript-eslint/max-params": 'warn',
      '@typescript-eslint/member-ordering': 'warn',
      '@typescript-eslint/method-signature-style': 'warn',
      //"@typescript-eslint/naming-convention": 'warn',
      '@typescript-eslint/no-dupe-class-members': 'warn',
      '@typescript-eslint/no-import-type-side-effects': 'warn',

      '@typescript-eslint/no-invalid-this': 'warn',
      '@typescript-eslint/no-loop-func': 'warn',
      //"@typescript-eslint/no-magic-numbers" : 'warn',
      '@typescript-eslint/no-redeclare': 'warn',

      '@typescript-eslint/no-restricted-imports': 'warn',
      '@typescript-eslint/no-restricted-types': 'warn',
      '@typescript-eslint/no-shadow': 'warn',
      //"@typescript-eslint/no-type-alias" : 'warn',
      '@typescript-eslint/no-unnecessary-parameter-property-assignment': 'warn',

      '@typescript-eslint/no-unnecessary-qualifier': 'warn',
      //"@typescript-eslint/no-unsafe-type-assertion" : 'warn',
      '@typescript-eslint/no-use-before-define': 'warn',
      '@typescript-eslint/no-useless-empty-export': 'warn',

      '@typescript-eslint/parameter-properties': 'warn',
      '@typescript-eslint/prefer-destructuring': 'warn',
      '@typescript-eslint/prefer-enum-initializers': 'warn',
      '@typescript-eslint/prefer-readonly': 'warn',
      '@typescript-eslint/prefer-readonly-parameter-types': [
        'warn',
        {
          allow: [
            { from: 'lib', name: 'Array' },
            { from: 'package', name: 'RequestInit', package: 'node-fetch' },
            { from: 'package', name: ['MeiliSearch', 'Index'], package: 'meilisearch' },
            {
              from: 'package',
              name: [
                'Interaction',
                'ChatInputCommandInteraction',
                'ButtonInteraction',
                'AutocompleteInteraction',
                'ModalSubmitInteraction',
                'RoleSelectMenuInteraction',
                'Client',
                'GuildEmoji',
                'Role',
                'GuildMember',
                'Guild',
                'TextChannel',
                'Message',
                'MessageContextMenuCommandInteraction'
              ],
              package: 'discord.js'
            }
          ]
        }
      ],

      '@typescript-eslint/promise-function-async': 'warn',
      '@typescript-eslint/require-array-sort-compare': 'warn',
      '@typescript-eslint/strict-boolean-expressions': 'warn',
      '@typescript-eslint/switch-exhaustiveness-check': 'warn',
      '@typescript-eslint/typedef': 'warn',

      '@typescript-eslint/restrict-template-expressions': ['warn', { allowNumber: true }],
      '@typescript-eslint/no-misused-promises': ['warn', { checksVoidReturn: false }],

      '@typescript-eslint/consistent-type-definitions': ['warn', 'type'],
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^guild$' }],

      'eqeqeq': 'warn',
      'strict': 'warn',
      'array-callback-return': 'warn',
      //"no-await-in-loop": 'warn',
      'no-constructor-return': 'warn',

      'no-duplicate-imports': 'warn',
      'no-inner-declarations': 'warn',
      'no-promise-executor-return': 'warn',
      'no-self-compare': 'warn',
      'no-template-curly-in-string': 'warn',
      'no-unmodified-loop-condition': 'warn',
      'no-unreachable-loop': 'warn',

      'no-use-before-define': 'off',
      'no-useless-assignment': 'warn',
      'require-atomic-updates': 'warn',

      'no-unused-expressions': 'warn',
      'no-invalid-this': 'warn'
    }
  }
);
