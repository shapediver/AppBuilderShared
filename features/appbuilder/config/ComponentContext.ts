import {createContext} from "react";
import {IComponentContext} from "./ComponentContext.types";

export const DummyComponent: IComponentContext = {};

export const ComponentContext =
	createContext<IComponentContext>(DummyComponent);
