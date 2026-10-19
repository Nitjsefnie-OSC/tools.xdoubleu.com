module.exports = {
  forbidden: [
    {
      name: 'no-cross-domain-imports',
      comment:
        "app/<domain>/ and components/<domain>/ must not import another domain's components/<domain>/ or lib/<domain>/. dashboard is exempt in the `from` direction only (ADR-0007: it reaches other apps' UI directly, the frontend analog of reaching another app only through exported struct methods on the Go side). #1730 moved every shoppinglist/mealplans component that used to be misplaced under components/recipes and lib/recipes into its own domain, so this rule no longer needs an allow-list.",
      severity: 'error',
      from: {
        path: '^(?:app|components)/(?!dashboard/)([^/]+)/'
      },
      to: {
        // Shared folders, not domains. lib/oauth2as belongs to app/oauth (mirrors
        // the api's package name); offline serves every app.
        path: '^(?:components|lib)/(?!ui/|notifications/|gen/|oauth2as/|offline/)([^/]+)/',
        pathNot: ['^components/$1/', '^lib/$1/']
      }
    }
  ],
  options: {
    doNotFollow: {
      path: 'node_modules'
    },
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: 'tsconfig.json'
    },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default']
    }
  }
}
