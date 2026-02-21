import {
	type RenderOptions,
	render as rtlRender,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "jotai";
import { ThemeProvider } from "next-themes";
import React, { type ReactElement, type ReactNode } from "react";

interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
	themeProps?: {
		defaultTheme?: string;
		themes?: string[];
	};
}

function AllTheProviders({ children }: { children: ReactNode }) {
	return (
		<Provider>
			<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
				{children}
			</ThemeProvider>
		</Provider>
	);
}

function customRender(ui: ReactElement, options?: CustomRenderOptions) {
	const user = userEvent.setup();

	const { ...rtlOptions } = options ?? {};

	return {
		user,
		...rtlRender(ui, { wrapper: AllTheProviders, ...rtlOptions }),
	};
}

export * from "@testing-library/react";
export { customRender as render };
export { userEvent };
