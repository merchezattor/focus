import { type IncomingMessage, ServerResponse } from "node:http";
import type { NextRequest } from "next/server";

export function createMockIncomingMessage(
	request: NextRequest,
): IncomingMessage {
	const headers: Record<string, string> = {};
	request.headers.forEach((value, key) => {
		headers[key] = value;
	});

	return {
		headers,
		url: request.url,
		method: request.method,
	} as IncomingMessage;
}

export function createResponseHandler(): {
	res: ServerResponse;
	getResponse: () => Promise<Response>;
} {
	let statusCode = 200;
	const responseHeaders: Record<string, string | string[]> = {};
	const chunks: Buffer[] = [];
	let resolveResponse: (response: Response) => void;

	const responsePromise = new Promise<Response>((resolve) => {
		resolveResponse = resolve;
	});

	const res = new ServerResponse({
		method: "POST",
		url: "/api/mcp",
	} as IncomingMessage);

	res.writeHead = (code: number, headersOrPhrase?: unknown) => {
		statusCode = code;
		if (typeof headersOrPhrase === "object" && headersOrPhrase !== null) {
			Object.assign(responseHeaders, headersOrPhrase);
		}
		return res;
	};

	res.write = (chunk: unknown) => {
		if (chunk) {
			chunks.push(Buffer.from(chunk as string | Buffer));
		}
		return true;
	};

	res.end = (data?: unknown) => {
		if (data) {
			chunks.push(Buffer.from(data as string | Buffer));
		}

		const body = Buffer.concat(chunks).toString();
		const response = new Response(body, {
			status: statusCode,
			headers: Object.entries(responseHeaders).reduce(
				(acc, [key, value]) => {
					acc[key] = Array.isArray(value) ? value.join(", ") : value;
					return acc;
				},
				{} as Record<string, string>,
			),
		});

		resolveResponse(response);
		return res;
	};

	return {
		res,
		getResponse: () => responsePromise,
	};
}
