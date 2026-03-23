/** Definition of a single column in the table widget. */
export interface IAppBuilderWidgetPropsTableColumn {
	/** Column accessor key — must match a field name in the records. */
	accessor: string;
	/** Optional display title for the column header. Defaults to the accessor. */
	title?: string;
	/** Allow sorting by this column. */
	sortable?: boolean;
	/** Show a search/filter input for this column. */
	searchable?: boolean;
	/** Optional fixed column width (number = px, string = CSS value). */
	width?: number | string;
}

/** Properties of a table widget. */
export interface IAppBuilderWidgetPropsTable {
	/** Optional caption displayed below the table. */
	caption?: string;
	/** Column definitions. */
	columns: IAppBuilderWidgetPropsTableColumn[];
	/** Table records (rows). Each record must be an object whose keys match column accessors. */
	records: Record<string, unknown>[];
	/** Highlight row on hover. Default: false. */
	highlightOnHover?: boolean;
	/** Stick the header row to the top when scrolling. Default: false. */
	stickyHeader?: boolean;
	/** Alternate row background color. Default: false. */
	striped?: boolean;
	/** Show borders between columns. Default: false. */
	withColumnBorders?: boolean;
	/** Show borders between rows. Default: true. */
	withRowBorders?: boolean;
	/** Show an outer border around the table. Default: false. */
	withTableBorder?: boolean;
	/**
	 * Fixed height in pixels. Constrains the scroll container height.
	 * When omitted the table grows to fit its content.
	 */
	height?: number;
	/**
	 * Estimated row height in pixels used by the virtualizer.
	 * Tune this to match the actual rendered row height for accurate scrollbar behaviour.
	 * Default: 34.
	 */
	estimateRowHeight?: number;
	/**
	 * Number of extra rows rendered outside the visible area on each side.
	 * Higher values reduce blank-row flicker during fast scrolling at the cost of more DOM nodes.
	 * Default: 10.
	 */
	overscan?: number;
}
