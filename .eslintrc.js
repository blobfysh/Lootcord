module.exports = {
	env: {
		'node': true,
		'commonjs': true,
		'es2021': true,
		'jest/globals': true
	},
	plugins: ['jest'],
	extends: 'eslint:recommended',
	parserOptions: {
		ecmaVersion: 12
	},
	rules: {
		'indent': ['error', 'tab'],
		'quotes': ['error', 'single'],
		'semi': ['error', 'never'],
		'max-classes-per-file': ['error', 1],
		'dot-location': ['error', 'property'],
		'dot-notation': 'error',
		'eqeqeq': ['error', 'always'],
		'no-else-return': 'error',
		'no-eval': 'error',
		'no-implied-eval': 'error',
		'no-multi-spaces': 'error',
		'no-return-assign': 'error',
		'no-return-await': 'error',
		'no-self-compare': 'error',
		'no-throw-literal': 'error',
		'object-shorthand': ['error', 'always'],
		'space-in-parens': 'error',
		'block-spacing': 'error',
		'no-trailing-spaces': 'error',
		'comma-dangle': ['error', 'never'],
		'no-multiple-empty-lines': ['error', { max: 2, maxEOF: 1, maxBOF: 0 }],
		'brace-style': ['error', 'stroustrup', { allowSingleLine: true }],
		'space-before-blocks': 'error',
		'space-before-function-paren': ['error', 'never'],
		'eol-last': 'error',
		'quote-props': ['error', 'consistent-as-needed'],
		'prefer-template': 'error',
		'template-curly-spacing': 'error',
		'no-console': 'off',
		'yoda': 'error',
		'require-atomic-updates': 0,
		'no-irregular-whitespace': ['error', { skipStrings: true, skipComments: true, skipTemplates: true }],
		'max-depth': ['error', 8],
		'max-nested-callbacks': ['error', { max: 4 }],
		'max-statements-per-line': ['error', { max: 2 }],
		'comma-spacing': 'error',
		'comma-style': 'error',
		'key-spacing': 'error',
		'keyword-spacing': 'error',
		'array-bracket-spacing': 'error',
		'computed-property-spacing': 'error',
		'object-curly-spacing': ['error', 'always'],
		'template-tag-spacing': 'error',
		'arrow-spacing': 'error',
		'semi-spacing': 'error',
		'curly': ['error', 'multi-line', 'consistent'],
		'no-void': 'error',
		'no-useless-call': 'error',
		'no-useless-concat': 'error',
		'no-useless-escape': 'error',
		'no-useless-return': 'error',
		'no-compare-neg-zero': 'error',
		'func-style': ['error', 'declaration', { allowArrowFunctions: true }],
		'no-extra-parens': ['warn', 'all', { nestedBinaryExpressions: false }],
		'no-template-curly-in-string': 'error',
		'no-unused-vars': ['error', { args: 'none' }],
		'prefer-const': 'error',
		'no-var': 'error',
		'no-prototype-builtins': 'off',
		'no-unsafe-negation': 'error',
		'accessor-pairs': 'warn',
		'no-empty-function': 'error',
		'no-floating-decimal': 'error',
		'no-invalid-this': 'error',
		'no-lone-blocks': 'error',
		'no-new-func': 'error',
		'no-new-wrappers': 'error',
		'no-octal-escape': 'error',
		'no-sequences': 'error',
		'no-unmodified-loop-condition': 'error',
		'no-warning-comments': 'warn',
		'prefer-promise-reject-errors': 'error',
		'wrap-iife': 'error',
		'no-label-var': 'error',
		'no-shadow': 'error',
		'no-undef-init': 'error',
		'handle-callback-err': 'error',
		'no-mixed-requires': 'error',
		'no-new-require': 'error',
		'no-path-concat': 'error',
		'consistent-this': ['error', '$this'],
		'func-name-matching': 'error',
		'new-cap': 'off',
		'newline-per-chained-call': ['error', { ignoreChainWithDepth: 5 }],
		'no-array-constructor': 'error',
		'no-lonely-if': 'error',
		'no-mixed-operators': 'error',
		'no-new-object': 'error',
		'no-spaced-func': 'error',
		'no-unneeded-ternary': 'error',
		'no-whitespace-before-property': 'error',
		'nonblock-statement-body-position': 'error',
		'operator-assignment': 'error',
		'operator-linebreak': ['error', 'after'],
		'padded-blocks': ['error', 'never'],
		'space-infix-ops': 'error',
		'space-unary-ops': 'error',
		'spaced-comment': 'error',
		'unicode-bom': 'error',
		'arrow-body-style': 'error',
		'arrow-parens': ['error', 'as-needed'],
		'no-duplicate-imports': 'error',
		'no-useless-computed-key': 'error',
		'no-useless-constructor': 'error',
		'prefer-arrow-callback': 'error',
		'prefer-numeric-literals': 'error',
		'prefer-rest-params': 'error',
		'prefer-spread': 'error',
		'rest-spread-spacing': 'error',
		'multiline-ternary': ['error', 'always-multiline']
	}
}
