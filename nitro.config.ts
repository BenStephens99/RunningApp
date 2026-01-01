import { defineNitroConfig } from "nitro/config";

export default defineNitroConfig({
  noExternal: ["@tabler/icons-react"],
  experimental: {
    wasm: true,
  },
});

