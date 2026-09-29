import esbuild from 'esbuild';

const prod = process.argv[2] === 'production';

await esbuild.build({
  entryPoints: ['main.ts'],
  bundle: true,
  external: ['obsidian'],
  format: 'cjs',
  target: 'es2018',
  sourcemap: false,
  treeShaking: true,
  minify: prod,
  outfile: 'main.js',
});
