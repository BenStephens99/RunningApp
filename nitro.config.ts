import { defineNitroConfig } from "nitro/config";

export default defineNitroConfig({
  externals: {
    inline: ["@tabler/icons-react"],
  },
  publicAssets: [
    {
      baseURL: "/",
      dir: "public",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    },
  ],
});
