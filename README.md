# AppBuilderShared

React hooks and components shared by ShapeDiver App Builder and other projects. This might eventually become an npm package.

## <a name="getting-started">🚀 Getting Started</a>

Set `@AppBuilderShared` alias for the package directory

e.g. {librarypath} = `src/shared`

<details>
<summary>Vite (vite.config.ts)</summary>

```text
{
  resolve: {
    alias: {
      "@AppBuilderShared": path.resolve(__dirname, "./{librarypath}"),
    },
  },
}
```

</details>
<details>
<summary>Typescript (tsconfig.json)</summary>

```json
{
	"compilerOptions": {
		"baseUrl": ".",
		"paths": {
			"@AppBuilderShared/*": ["./{librarypath}/*"]
		}
	}
}
```

</details>
