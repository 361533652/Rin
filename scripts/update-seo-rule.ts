// 用 Cloudflare Rules API 更新「URL 重写」转换规则（爬虫 → /seo/*）
// 绕开面板表达式编辑器，API 返回确切校验错误。
//
// 用法：
//   CLOUDFLARE_API_TOKEN=<token> bun scripts/update-seo-rule.ts
// 可选：
//   ZONE_ID=<zoneId>              指定 zone（缺省用 FRONTEND_URL / RIN_HOST 解析）
//   RIN_HOST=rin.361533.xyz       zone 域名（缺省从 FRONTEND_URL 解析）
//   SEO_RULE_EXPRESSION="..."     自定义表达式（缺省用内置多爬虫版本）
//
// 该脚本只改动「action=rewrite 且重写到 /seo 前缀」的那条规则，其余规则原样保留。

const env = process.env;
const token = env.CLOUDFLARE_API_TOKEN;
if (!token) throw new Error("CLOUDFLARE_API_TOKEN is not defined");

const api = "https://api.cloudflare.com/client/v4";
const headers = {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json",
};

// —— 1. 定位 zone ——
const host = env.RIN_HOST
    || new URL(env.FRONTEND_URL || "https://rin.361533.xyz").hostname;
let zoneId = env.ZONE_ID;
if (!zoneId) {
    const res = await fetch(`${api}/zones?name=${host}`, { headers });
    const json: any = await res.json();
    if (!json.success) throw new Error(`zone lookup failed: ${JSON.stringify(json.errors)}`);
    const zone = json.result?.[0];
    if (!zone) throw new Error(`zone "${host}" not found — 请检查域名是否已在 Cloudflare`);
    zoneId = zone.id;
}
console.log(`zone: ${host} (${zoneId})`);

// —— 2. 读取 http_request_transform 阶段的规则集（entrypoint）——
const epUrl = `${api}/zones/${zoneId}/rulesets/phases/http_request_transform/entrypoint`;
const getRes = await fetch(epUrl, { headers });
const getJson: any = await getRes.json();
if (getJson.result && !getJson.result.id) {
    // 可能还没有 ruleset，result 为空
    console.log("当前无 transform ruleset，将新建。");
}
const ruleset = getJson.result || { rules: [] };
const rules = Array.isArray(ruleset.rules) ? ruleset.rules : [];
console.log(`当前 transform 规则数: ${rules.length}`);
for (const r of rules) {
    const target = r.action_parameters?.uri?.path?.expression || "";
    console.log(` - [${r.description || "无描述"}] action=${r.action} path_expr=${target} expr=${String(r.expression).slice(0, 80)}...`);
}

// —— 3. 定位「重写到 /seo」的那条规则 ——
const seoRules = rules.filter(
    (r: any) => r.action === "rewrite"
        && String(r.action_parameters?.uri?.path?.expression || "").includes('"/seo"')
);
if (seoRules.length === 0) {
    console.error("找不到「重写到 /seo」的规则。请先人工在面板确认现有规则是否以 rewrite /seo 形式存在。");
    process.exit(1);
}

// —— 4. 替换表达式 ——
const DEFAULT_EXPRESSION = [
    `http.host eq "${host}"`,
    `(http.user_agent contains "Googlebot" or http.user_agent contains "Bingbot" or http.user_agent contains "Baiduspider" or http.user_agent contains "YandexBot" or http.user_agent contains "Sogou" or http.user_agent contains "Bytespider" or http.user_agent contains "YisouSpider" or http.user_agent contains "DuckDuckBot")`,
    `not starts_with(http.request.uri.path, "/sub/")`,
    `not starts_with(http.request.uri.path, "/seo/")`,
    `not starts_with(http.request.uri.path, "/assets/")`,
    `not starts_with(http.request.uri.path, "/locales/")`,
    `http.request.uri.path ne "/robots.txt"`,
    `http.request.uri.path ne "/particles.js"`,
].join(" and ");

const newExpression = env.SEO_RULE_EXPRESSION || DEFAULT_EXPRESSION;
for (const r of seoRules) {
    r.expression = newExpression;
}

// —— 5. 写回 ——
const putBody = {
    name: ruleset.name || "default",
    kind: ruleset.kind || "zone",
    phase: "http_request_transform",
    rules,
};
const putRes = await fetch(epUrl, {
    method: "PUT",
    headers,
    body: JSON.stringify(putBody),
});
const putJson: any = await putRes.json();
if (!putJson.success) {
    console.error("\n❌ API 拒绝。错误原文：");
    console.error(JSON.stringify(putJson.errors, null, 2));
    process.exit(1);
}
console.log("\n✅ 已更新。新表达式：");
console.log(newExpression);
