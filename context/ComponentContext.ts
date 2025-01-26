import { IComponentContext } from "@AppBuilderShared/types/context/componentcontext";
import { createContext } from "react";

export const DummyComponent: IComponentContext = {};

export const ComponentContext = createContext<IComponentContext>(DummyComponent);
