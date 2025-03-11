import {NavLink} from "@mantine/core";
import React from "react";
import {Link, Outlet} from "react-router-dom";

/**
 * Function that creates the contents of the navigation bar.
 * Creates buttons that points to various pages.
 *
 * @returns
 */
export default function NavigationBar() {
	return (
		<>
			<NavLink label="Home" component={Link} to="/" />
			<NavLink label="View Page" component={Link} to="/view" />
			<NavLink label="Select Page" component={Link} to="/modelSelect" />
			<NavLink
				label="Multiple Viewports"
				component={Link}
				to="/multipleViewport"
			/>
			<NavLink label="Custom UI" component={Link} to="/customui" />
			<NavLink
				label="Web App Test"
				component={Link}
				to="/appBuilderTest"
			/>
			<NavLink label="Web App" component={Link} to="/appBuilder" />

			<Outlet />
		</>
	);
}
