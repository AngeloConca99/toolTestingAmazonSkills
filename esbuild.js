const { build } = require("esbuild");
const fs = require('fs-extra');

const sourceDir = './implementations';
const targetDir = './out/implementations';

fs.copy(sourceDir, targetDir, err => {
  if (err) {
    console.error('Errore durante la copia:', err);
    return;
  }
  console.log('Copia completata con successo.');
});



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

// rename in mainConfig
const webviewConfig = {
  ...baseConfig,
  target: "es2020",
  format: "esm",
  entryPoints: ["./src/webview/main.mts"],
  outfile: "./out/webview.js"
};


const savedConfig = {
  ...baseConfig,
  target: "es2020",
  format: "esm",
  entryPoints: ["./src/webview/saved.mts"],
  outfile: "./out/saved.js"
};

// rename to mainCss
const css={
  ...baseConfig,
  target: "es2020",
  format: "esm",
  loader: {".css": "file",},
  entryPoints: ["./src/component/styles.css"],
  outdir:"./out"
};

const savedCss={
  ...baseConfig,
  target: "es2020",
  format: "esm",
  loader: {".css": "file",},
  entryPoints: ["./src/component/savedStyles.css"],
  outdir:"./out"
};
const saveConfig = {
  ...baseConfig,
  target: "es2020",
  format: "esm",
  entryPoints: ["./src/webview/test.mts"],
  outfile: "./out/test.js"
};
const resultConfig = {
  ...baseConfig,
  target: "es2020",
  format: "esm",
  entryPoints: ["./src/webview/result.mts"],
  outfile: "./out/result.js"
};

const buildExtension = async () => {
  await build(extensionConfig);};

const buildWebview = async () => {
    await build(webviewConfig);
 };
const buildCSS = async () => {
  await build(css);
};

const buildSaved = async () => {
  await build(savedConfig);
};
const buildSave = async () => {
  await build(saveConfig);
};
const buildResult = async () => {
  await build(resultConfig);
};

const buildSavedCss = async () => {
  await build(savedCss);
};




const buildAll = async () => {
    await buildExtension();
    await buildWebview();
    await buildCSS();
    await buildSaved();
    await buildSave();
    await buildResult();
    await buildSavedCss();
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