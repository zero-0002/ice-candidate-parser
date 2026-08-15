# getstats-report

A tiny TypeScript CLI that turns a WebRTC `getStats()` JSON dump into a Markdown
table you can paste straight into an issue.

## Usage

```bash
npm install
npm run build
node dist/cli.js getstats.json
# or, without building:
npm start -- getstats.json
```

Capture a dump in the browser:

```js
const stats = await pc.getStats();
console.log(JSON.stringify([...stats.values()]));
```

## Output

| Dir | Kind | Codec | KiB | Loss % | Jitter (ms) | FPS |
| --- | --- | --- | ---: | ---: | ---: | ---: |
| inbound | video | VP8 | 1024.0 | 0.12 | 3.4 | 30 |

MIT licensed.
