import fs from "node:fs";
import path from "node:path";
import type { CapacitorConfig } from "@capacitor/cli";

const envLocalPath = path.join(process.cwd(), ".env.local");

if (fs.existsSync(envLocalPath)) {
  const envText = fs.readFileSync(envLocalPath, "utf8");

  for (const line of envText.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

const appId = process.env.CAPACITOR_APP_ID ?? "cn.quotecraft.app";
const appName = process.env.CAPACITOR_APP_NAME ?? "\u62A5\u4EF7\u52A9\u624B";
const serverUrl = process.env.NEXT_PUBLIC_CAPACITOR_SERVER_URL?.trim();

const config: CapacitorConfig = {
  appId,
  appName,
  webDir: "capacitor-shell",
  server: serverUrl
    ? {
        url: serverUrl,
        cleartext: serverUrl.startsWith("http://"),
        allowNavigation: ["*"]
      }
    : undefined,
  android: {
    allowMixedContent: !!serverUrl && serverUrl.startsWith("http://")
  }
};

export default config;
