// Gera index.html (PWA para celular/GitHub Pages) a partir de fluencia.html (fonte do artefato no Claude).
// Uso: node build.js
const fs = require("fs");
const src = fs.readFileSync("fluencia.html", "utf8");
const cut = src.indexOf("</style>") + "</style>".length;
const head = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#131C33">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="15+15">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" type="image/svg+xml" href="icons/icon.svg">
<link rel="apple-touch-icon" href="icons/icon-192.png">
<style>:root{padding-top:env(safe-area-inset-top,0px)}</style>
`;
const sw = `<script>
if ("serviceWorker" in navigator && location.protocol === "https:") {
  navigator.serviceWorker.register("sw.js").catch(()=>{});
}
</script>`;
const out = head + src.slice(0, cut) + "\n</head>\n<body>\n" + src.slice(cut) + "\n" + sw + "\n</body>\n</html>\n";
fs.writeFileSync("index.html", out);
console.log("index.html gerado (" + out.length + " bytes)");
