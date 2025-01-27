import React from "react";
import Markdown from "react-markdown";
import {
	Anchor,
	Blockquote,
	Code,
	Text,
	Title,
	Divider,
	Image,
	MantineStyleProps,
	List,
	Table,
	MantineThemeComponent,
	useProps,
	useMantineTheme,
} from "@mantine/core";
import {Options} from "react-markdown/lib";
import remarkDirective from "remark-directive";
import remarkGfm from "remark-gfm";
import {visit} from "unist-util-visit";
import classes from "./MarkdownWidgetComponent.module.css";

interface Props {
	children: string;
}

interface StyleProps {
	anchorTarget: React.HTMLAttributeAnchorTarget;
	boldFontWeight: string;
	strongFontWeight: string;
	setHeadingFontSize: boolean;
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
				const {color} = attributes;

				if (!color) {
					file.fail(
						"Unexpected missing `color` on `span` directive",
						node,
					);
				}

				data.hName = "span";
				data.hProperties = {
					style: {color},
					// The following uuid key causes a warning "A props object containing a 'key' prop is being spread into JSX"
					// It's unclear why the key would be necessary here, so it's commented out.
					//key: uuid(),
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
	const {anchorTarget, boldFontWeight, strongFontWeight, setHeadingFontSize} =
		useProps("MarkdownWidgetComponent", defaultStyleProps, rest);

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

	return <Markdown {...config}>{children}</Markdown>;
}
