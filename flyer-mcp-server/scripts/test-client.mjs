// MCPサーバの簡易動作確認クライアント。 node scripts/test-client.mjs
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({ command: "node", args: ["dist/index.js"] });
const client = new Client({ name: "test", version: "1.0.0" });
await client.connect(transport);

const tools = await client.listTools();
console.log("TOOLS:", tools.tools.map((t) => t.name).join(", "));

async function call(name, args = {}) {
  const r = await client.callTool({ name, arguments: args });
  const text = (r.content || []).filter((c) => c.type === "text").map((c) => c.text).join(" | ");
  const hasImage = (r.content || []).some((c) => c.type === "image");
  console.log(`\n# ${name}(${JSON.stringify(args)}) err=${!!r.isError} image=${hasImage}`);
  console.log("  " + text.slice(0, 240).replace(/\n/g, " "));
  return r;
}

await call("flyer_list_text", { area: "flyer.elegant" });
await call("flyer_set_text", { path: "flyer.elegant.title.0", value: "テスト見出し" });
await call("flyer_list_text", { area: "flyer.elegant.title" });
await call("flyer_list_photos");
await call("flyer_set_photo", { id: "hero-flyer", focalX: 0.4, focalY: 0.5 });
await call("flyer_list_assets", { filter: "8240" });
await call("flyer_set_color", { tone: "elegant", key: "primary", value: "#800020" });
const pv = await call("flyer_preview", { output: "flyer", tone: "elegant" });
console.log("  preview image bytes:", (pv.content || []).find((c) => c.type === "image")?.data?.length || 0);
await call("flyer_reset", { confirm: true }); // 後始末（初期化）

await client.close();
console.log("\nDONE");
process.exit(0);
