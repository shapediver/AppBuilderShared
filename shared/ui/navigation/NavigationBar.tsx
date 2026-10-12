import {NavLink} from "@mantine/core";

/**
 * Function that creates the contents of the navigation bar.
 * Creates buttons that points to various pages.
 *
 * @returns
 */
export default function NavigationBar() {
	return (
		<>
			<NavLink label="Home" component="a" href="#/" />
			<NavLink label="View Page" component="a" href="#/view" />
			<NavLink label="Select Page" component="a" href="#/modelSelect" />
			<NavLink
				label="Multiple Viewports"
				component="a"
				href="#/multipleViewport"
			/>
			<NavLink label="Custom UI" component="a" href="#/customui" />
			<NavLink
				label="Web App Test"
				component="a"
				href="#/appBuilderTest"
			/>
			<NavLink label="Web App" component="a" href="#/appBuilder" />
		</>
	);
}
