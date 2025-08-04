import {useEffect, useRef, useState} from "react";

const useIconMenu = (visible: boolean, onClickOutside: () => void) => {
	const menuRef = useRef<HTMLDivElement>(null);
	const [isMenuOpened, setIsMenuOpened] = useState(false);

	useEffect(() => {
		if (!visible) {
			setIsMenuOpened(false);
		}
	}, [visible]);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				menuRef.current &&
				!menuRef.current.contains(event.target as Node)
			) {
				onClickOutside();
			}
		};
		document.addEventListener("click", handleClickOutside);

		return () => document.removeEventListener("click", handleClickOutside);
	}, []);

	return {menuRef, isMenuOpened, setIsMenuOpened};
};

export default useIconMenu;
