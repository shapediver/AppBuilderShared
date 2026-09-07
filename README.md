# AppBuilderShared

React hooks and components shared by [ShapeDiver App Builder](https://github.com/shapediver/AppBuilderSdk) and other projects. This might eventually become an npm package.

## <a name="getting-started">🚀 Getting Started</a>

Set `@AppBuilderShared` and `@AppBuilderLib` aliases for the package directory. Both must resolve to the same root: internals use `@AppBuilderLib/` (feature-sliced design), while some modules still import `@AppBuilderShared/`.

e.g. {librarypath} = `src/shared`

<details>
<summary>Vite (vite.config.ts)</summary>

```text
{
  resolve: {
    alias: {
      "@AppBuilderShared": path.resolve(__dirname, "./{librarypath}"),
      "@AppBuilderLib": path.resolve(__dirname, "./{librarypath}"),
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
			"@AppBuilderShared/*": ["./{librarypath}/*"],
			"@AppBuilderLib/*": ["./{librarypath}/*"]
		}
	}
}
```

</details>
