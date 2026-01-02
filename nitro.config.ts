import { defineNitroConfig } from "nitro/config";

export default defineNitroConfig({
  externals: {
    inline: ["@tabler/icons-react"],
  },
});
