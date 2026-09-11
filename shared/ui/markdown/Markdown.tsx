import {
	Anchor,
	Blockquote,
	Code,
	Divider,
	Image,
	List,
	MantineStyleProps,
	Table,
	Text,
	Title,
	useMantineTheme,
} from "@mantine/core";
import React from "react";
import ReactMarkdown from "react-markdown";
import {Options} from "react-markdown/lib";
import remarkDirective from "remark-directive";
import remarkGfm from "remark-gfm";
import {visit} from "unist-util-visit";
import classes from "./Markdown.module.css";

const shownWarnings = new Set<string>();

const noopDirectiveWarning = (_message: string) => {};

export interface MarkdownStyleProps {
	/**
	 * Target for markdown links.
	 * @default "_blank"
	 */
	anchorTarget?: React.HTMLAttributeAnchorTarget;
	boldFontWeight?: string;
	strongFontWeight?: string;
	setHeadingFontSize?: boolean;
}

export interface MarkdownProps extends MarkdownStyleProps {
	children: string;
	onDirectiveWarning?: (message: string) => void;
}

function spanDirective(onDirectiveWarning: (message: string) => void) {
	return (tree: any) => {
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
					const warningKey =
						"notification-warning-missing-color-style";
					if (!shownWarnings.has(warningKey)) {
						shownWarnings.add(warningKey);
						onDirectiveWarning(
							"Unexpected missing `color` or `style` on `span` directive",
						);
					}
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
						case "overline":
							styleObj.textDecoration = "overline";
							break;
						default: {
							const warningKey = `invalid-style-${style}`;
							if (!shownWarnings.has(warningKey)) {
								shownWarnings.add(warningKey);
								onDirectiveWarning(
									`Unexpected style value "${style}" on span directive. Supported values: sub, sup, ins, overline`,
								);
							}
							return;
						}
					}
				}

				data.hProperties = {
					style: styleObj,
				};
			}
		});
	};
}

/**
 * GFM markdown renderer with App Builder span dialect and Mantine tag mapping.
 */
export default function Markdown(props: MarkdownProps) {
	const {
		children,
		onDirectiveWarning = noopDirectiveWarning,
		anchorTarget = "_blank",
		boldFontWeight,
		strongFontWeight,
		setHeadingFontSize,
	} = props;

	const styleProps: MantineStyleProps = {
		mb: "xs",
	};

	const theme = useMantineTheme();
	const headingSizes = theme.headings.sizes;

	const config: Options = {
		remarkPlugins: [
			remarkDirective,
			remarkGfm,
			() => spanDirective(onDirectiveWarning),
		],
		components: {
			b(props) {
				const {ref: _ref, ...rest} = props;

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

				return <Anchor target={anchorTarget} {...rest} />;
			},
			ul(props) {
				const {ref: _ref, ...rest} = props;

				return <List {...rest} {...styleProps} />;
			},
			ol(props) {
				const {ref: _ref, ...rest} = props;

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

	return (
		<ReactMarkdown className={classes.markdownNormalize} {...config}>
			{children}
		</ReactMarkdown>
	);
}
