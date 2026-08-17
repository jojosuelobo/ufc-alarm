import { build } from "./app.js";
import { config } from "./config.js";

const app = build();

app.listen({ port: config.port, host: config.host }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
});
