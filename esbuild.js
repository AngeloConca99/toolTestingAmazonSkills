const { build } = require("esbuild");

const baseConfig = {
  bundle: true,
  minify: process.env.NODE_ENV === "production",
  sourcemap: process.env.NODE_ENV !== "production",
};

const extensionConfig = {
  ...baseConfig,
  platform: "node",
  mainFields: ["module", "main"],
  format: "cjs",
  entryPoints: ["./src/extension.ts"],
  outfile: "./out/extension.js",
  external: ["vscode"],
};

const webviewConfig = {
  ...baseConfig,
  target: "es2020",
  format: "esm",
  entryPoints: ["./src/webview/main.mts"],
  outfile: "./out/webview.js"
};
const html={
  ...baseConfig,
  target: "es2020",
  format: "esm",
  loader: {".html": "file",},
  entryPoints: ["./src/component/display.html"],
  outdir:"./out"
};
const css={
  ...baseConfig,
  target: "es2020",
  format: "esm",
  loader: {".css": "file",},
  entryPoints: ["./src/component/styles.css"],
  outdir:"./out"
};


const buildExtension = async () => {
  await build(extensionConfig);};

const buildWebview = async () => {
    await build(webviewConfig);
 };
 const buildhtml = async () => {
  await build(html);
};
const builcss = async () => {
  await build(css);
};



const buildAll = async () => {
       await buildExtension();
        await buildWebview();
        await buildhtml();
        await builcss();
};

const watchConfig = {
  onRebuild(error, result) {
    console.log("[watch] build started");
    if (error) {
      error.errors.forEach(error =>
        console.error(`> ${error.location.file}:${error.location.line}:${error.location.column}: error: ${error.text}`)
      );
    } else {
      console.log("[watch] build finished");
    }
  },
};

(async () => {
  const args = process.argv.slice(2);
  try {
    if (args.includes("--watch")) {
      
      console.log("[watch] extension and webview started");
      await buildAll();  

      buildExtension(); 
      buildWebview();  
    } else {
      await buildAll();
      console.log("build complete");
    }
  } catch (err) {
    process.stderr.write(err.stderr);
    process.exit(1);
  }
})();