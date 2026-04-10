// Use process.env for Jest compatibility.
// Vite replaces these via define config in vite.config.ts.
export const envConfig = {
  vapi: {
    apiUrl: process.env.VITE_VAPI_API_URL ?? "https://api.vapi.ai",
    token: process.env.VITE_VAPI_WEB_TOKEN ?? "",
    assistantId: process.env.VITE_VAPI_ASSISTANT_ID ?? "",
    privateApiKey: process.env.VITE_VAPI_PRIVATE_API_KEY ?? "",
  },
};
