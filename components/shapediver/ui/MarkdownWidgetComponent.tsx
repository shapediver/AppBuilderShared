import {
	Anchor,
	Blockquote,
	Code,
	Divider,
	Image,
	List,
	MantineStyleProps,
	MantineThemeComponent,
	MantineThemeOverride,
	Table,
	Text,
	Title,
	useMantineTheme,
	useProps,
} from "@mantine/core";
import React from "react";
import Markdown from "react-markdown";
import {Options} from "react-markdown/lib";
import remarkDirective from "remark-directive";
import remarkGfm from "remark-gfm";
import {visit} from "unist-util-visit";
import classes from "./MarkdownWidgetComponent.module.css";
import ThemeProvider from "./ThemeProvider";

interface Props {
	children: string;
}

interface StyleProps {
	anchorTarget: React.HTMLAttributeAnchorTarget;
	boldFontWeight: string;
	strongFontWeight: string;
	setHeadingFontSize: boolean;
	themeOverride?: MantineThemeOverride;
}

const defaultStyleProps: Partial<StyleProps> = {
	anchorTarget: "_blank",
};

type MarkdownWidgetComponentPropsType = Partial<StyleProps>;

export function MarkdownWidgetComponentProps(
	props: MarkdownWidgetComponentPropsType,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}

const spanDirective = function () {
	/**
	 * @param {import("mdast").Root} tree
	 *   Tree.
	 * @param {import("vfile").VFile} file
	 *   File.
	 * @returns {undefined}
	 *   Nothing.
	 */
	return (tree: any, file: any) => {
		visit(tree, function (node) {
			if (
				node.type === "containerDirective" ||
				node.type === "leafDirective" ||
				node.type === "textDirective"
			) {
				if (node.name !== "span") return;

				const data = node.data || (node.data = {});
				const attributes = node.attributes || {};
				const {color, style} = attributes;

				if (!color && !style) {
					file.fail(
						"Unexpected missing `color` or `style` on `span` directive",
						node,
					);
					return;
				}

				data.hName = "span";
				const styleObj: any = {};
				if (color) {
					styleObj.color = color;
				}
				if (style) {
					switch (style) {
						case "sub":
							styleObj.verticalAlign = "sub";
							styleObj.fontSize = "smaller";
							break;
						case "sup":
							styleObj.verticalAlign = "super";
							styleObj.fontSize = "smaller";
							break;
						case "ins":
							styleObj.textDecoration = "underline";
							break;
						default:
							file.fail(
								`Unexpected style value "${style}" on span directive. Supported values: sub, sup, ins`,
								node,
							);
							return;
					}
				}

				data.hProperties = {
					style: styleObj,
				};
			}
		});
	};
};

/**
 * Markdown widget component.
 *
 * @returns
 */
export default function MarkdownWidgetComponent(
	props: Props & Partial<StyleProps>,
) {
	const {children, ...rest} = props;
	const {
		anchorTarget,
		boldFontWeight,
		strongFontWeight,
		setHeadingFontSize,
		themeOverride,
	} = useProps("MarkdownWidgetComponent", defaultStyleProps, rest);

	const styleProps: MantineStyleProps = {
		mb: "xs",
	};

	const theme = useMantineTheme();
	const headingSizes = theme.headings.sizes;

	const config: Options = {
		remarkPlugins: [remarkDirective, remarkGfm, spanDirective],
		components: {
			b(props) {
				const {...rest} = props;

				// @ts-expect-error ignore
				return <Text fw={boldFontWeight} {...rest} />;
			},
			blockquote(props) {
				const {...rest} = props;

				return <Blockquote {...rest} />;
			},
			code(props) {
				const {...rest} = props;

				return <Code {...rest} />;
			},
			em(props) {
				const {...rest} = props;

				return <em {...rest} />;
			},
			img(props) {
				const {...rest} = props;

				// @ts-expect-error ignore
				return <Image {...rest} />;
			},
			h1(props) {
				const {...rest} = props;

				return (
					<Title
						order={1}
						size={
							setHeadingFontSize
								? headingSizes.h1.fontSize
								: undefined
						}
						{...rest}
						{...styleProps}
					/>
				);
			},
			h2(props) {
				const {...rest} = props;

				return (
					<Title
						order={2}
						size={
							setHeadingFontSize
								? headingSizes.h2.fontSize
								: undefined
						}
						{...rest}
						{...styleProps}
					/>
				);
			},
			h3(props) {
				const {...rest} = props;

				return (
					<Title
						order={3}
						size={
							setHeadingFontSize
								? headingSizes.h3.fontSize
								: undefined
						}
						{...rest}
						{...styleProps}
					/>
				);
			},
			h4(props) {
				const {...rest} = props;

				return (
					<Title
						order={4}
						size={
							setHeadingFontSize
								? headingSizes.h4.fontSize
								: undefined
						}
						{...rest}
						{...styleProps}
					/>
				);
			},
			h5(props) {
				const {...rest} = props;

				return (
					<Title
						order={5}
						size={
							setHeadingFontSize
								? headingSizes.h5.fontSize
								: undefined
						}
						{...rest}
						{...styleProps}
					/>
				);
			},
			h6(props) {
				const {...rest} = props;

				return (
					<Title
						order={6}
						size={
							setHeadingFontSize
								? headingSizes.h6.fontSize
								: undefined
						}
						{...rest}
						{...styleProps}
					/>
				);
			},
			hr(props) {
				const {...rest} = props;

				return <Divider {...rest} {...styleProps} />;
			},
			p(props) {
				const {...rest} = props;

				// @ts-expect-error ignore
				return <Text {...rest} {...styleProps} />;
			},
			strong(props) {
				const {...rest} = props;

				return (
					<strong style={{fontWeight: strongFontWeight}} {...rest} />
				);
			},
			a(props) {
				const {...rest} = props;

				// @ts-expect-error ignore
				return <Anchor target={anchorTarget} {...rest} />;
			},
			ul(props) {
				const {...rest} = props;

				return <List {...rest} {...styleProps} />;
			},
			ol(props) {
				const {...rest} = props;

				return <List {...rest} {...styleProps} type="ordered" />;
			},
			li(props) {
				const {...rest} = props;

				return <List.Item {...rest} className={classes.listItem} />;
			},
			table(props) {
				const {...rest} = props;

				return <Table {...rest} {...styleProps} />;
			},
			thead(props) {
				const {...rest} = props;

				return <Table.Thead {...rest} {...styleProps} />;
			},
			tbody(props) {
				const {...rest} = props;

				return <Table.Tbody {...rest} {...styleProps} />;
			},
			td(props) {
				const {...rest} = props;

				return <Table.Td {...rest} {...styleProps} />;
			},
			th(props) {
				const {...rest} = props;

				return <Table.Th {...rest} {...styleProps} />;
			},
			tr(props) {
				const {...rest} = props;

				return <Table.Tr {...rest} {...styleProps} />;
			},
		},
	};

	const markdown = (
		<Markdown className={classes.markdownNormalize} {...config}>
			{children}
		</Markdown>
	);

	return themeOverride ? (
		<ThemeProvider theme={themeOverride}>{markdown}</ThemeProvider>
	) : (
		markdown
	);
}
