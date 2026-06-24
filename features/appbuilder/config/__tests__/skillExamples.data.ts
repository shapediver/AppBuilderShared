/** Mirrors JSON profiles in .cursor/skills/shapediver-appbuilder-settings/references/examples.md */
export const skillExamples = {
	"minimal-brand": {
		version: "1.0",
		themeOverrides: {
			primaryColor: "brand",
			colors: {
				brand: [
					"#f0f4ff",
					"#d9e2ff",
					"#b3c5ff",
					"#8da8ff",
					"#668bff",
					"#406eff",
					"#1a51ff",
					"#1541cc",
					"#103199",
					"#0c2166",
				],
			},
		},
	},
	"typography-only": {
		version: "1.0",
		themeOverrides: {
			fontFamily: "'Montserrat', sans-serif",
			components: {
				Text: {defaultProps: {fw: "300", size: "sm"}},
				Button: {defaultProps: {fw: "400"}},
			},
		},
	},
	"appshell-layout": {
		version: "1.0",
		themeOverrides: {
			components: {
				AppBuilderTemplateSelector: {
					defaultProps: {template: "appshell"},
				},
				AppBuilderAppShellTemplatePage: {
					defaultProps: {
						rows: {base: 10, md: 19},
						bottomFullWidth: true,
						rightBorder: false,
						keepBottomInGrid: true,
					},
				},
			},
		},
	},
	"nested-bottom-bar": {
		version: "1.0",
		themeOverrides: {
			components: {
				AppBuilderContainerWrapper: {
					defaultProps: {
						containerThemeOverrides: {
							appshell: {
								bottom: {
									components: {
										AppBuilderHorizontalContainer: {
											defaultProps: {
												pt: 0,
												pb: 0,
												styles: {
													root: {
														"grid-template-columns":
															"1fr auto auto",
														display: "grid",
														"align-items": "start",
													},
												},
											},
										},
									},
								},
							},
						},
					},
				},
			},
		},
	},
	"viewport-icons": {
		version: "1.0",
		themeOverrides: {
			components: {
				ViewportIcons: {
					defaultProps: {
						color: "#670000",
						enableArBtn: true,
						enableCamerasBtn: false,
						enableFullscreenBtn: false,
						enableZoomBtn: true,
					},
				},
			},
		},
	},
	"session-plus-theme": {
		version: "1.0",
		sessions: [{id: "default", slug: "my-model-slug"}],
		themeOverrides: {primaryColor: "gray"},
	},
	"appbuilder-override-sticky-tabs": {
		version: "1.0",
		appBuilderOverride: {
			version: "1.0",
			containers: [
				{
					name: "left",
					stickyTabs: true,
					tabs: [],
					widgets: [
						{
							type: "controls",
							props: {
								controls: [
									{
										type: "parameter",
										props: {name: "Width"},
									},
									{
										type: "action",
										props: {
											definition: {
												type: "addToCart",
												props: {
													description: "Line item description",
													tooltip: "Add item to cart",
												},
											},
										},
									},
								],
							},
						},
					],
				},
			],
		},
	},
	"invalid-button-props": {
		version: "1.0",
		themeOverrides: {
			components: {
				Button: {
					defaultProps: {
						onClick: "notAllowed",
						unknownProp: true,
					},
				},
			},
		},
	},
	"invalid-wrap-flex": {
		version: "1.0",
		themeOverrides: {
			components: {
				AppBuilderHorizontalContainer: {
					defaultProps: {wrap: "flex"},
				},
			},
		},
	},
} as const;
