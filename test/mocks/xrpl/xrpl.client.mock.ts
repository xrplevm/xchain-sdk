import { createMock, MethodMock, mockify } from "../../mock";

// Mock the connection object
export const XrplClientConnectionMock = mockify({
    getUrl: () => "wss://mock.xrpl.org",
});

// Mock the client
export const XrplClientMock = createMock({
    isConnected: new MethodMock("mockResolvedValue", true),
    connection: new MethodMock("mockResolvedValue", XrplClientConnectionMock),
    url: new MethodMock("mockResolvedValue", "wss://mock.xrpl.org"), // just set the value, don't use a getter
});
