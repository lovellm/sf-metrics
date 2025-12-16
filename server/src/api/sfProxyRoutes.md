# Snowflake Proxy Routes

These routes are simply proxies to the underlying Snowflake APIs. They begin with `/api/sf` and then finish the same as the Snowflake APIs.

They have an additional request parameter `asUser` that when true will run them as the user instead of as the Service.
There are currently no security checks. Any user can access anything that the Service role has access to.

## Inference Complete Example

Example of calling the api and consuming the results from a browser console window.

```js
var options = {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "llama3.1-8b",
    messages: [{ role: "user", content: "what are top benefits and dangers of using an LLM?" }],
  }),
};
var response = await fetch("/api/sf/api/v2/cortex/inference:complete", options);
var reader = response.body?.pipeThrough(new TextDecoderStream()).getReader();
var allChunks = [];
while (reader) {
  let stream = await reader.read();
  // to see individual chunks
  // console.log(stream);
  allChunks.push(stream);
  if (stream.done) break;
}
// to see consolidated final result
console.log(
  allChunks
    .map(
      (chunk) =>
        (chunk.value &&
          chunk.value
            .split("\n")
            .filter((o) => o)
            .map((c) => JSON.parse(c.substring(6)).choices[0].delta.text)) ||
        "",
    )
    .flat()
    .reduce((a, v) => a + v, ""),
);
```

## Search Example

Example of calling the api from a browser console window.

Note: The url ends in `/query` instead of `:query`.

```js
var options = {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    query: "What is a good question?",
    columns: ["Col1", "Col2"],
    limit: 4,
  }),
};
var response = await fetch(
  "/api/sf/api/v2/databases/{database}/schemas/{schema}/cortex-search-services/{service}/query",
  options,
);
await response.json();
```
