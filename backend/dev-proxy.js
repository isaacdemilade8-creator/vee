const http = require('http');

const listenHost = process.env.PROXY_HOST || '0.0.0.0';
const listenPort = Number(process.env.PROXY_PORT || 8003);
const targetHost = process.env.API_HOST || '127.0.0.1';
const targetPort = Number(process.env.API_PORT || 8002);

const server = http.createServer((clientReq, clientRes) => {
  clientReq.setTimeout(0);
  clientRes.setTimeout(0);

  const proxyReq = http.request(
    {
      host: targetHost,
      port: targetPort,
      method: clientReq.method,
      path: clientReq.url,
      headers: {
        ...clientReq.headers,
        host: clientReq.headers.host || `${targetHost}:${targetPort}`,
      },
    },
    (proxyRes) => {
      clientRes.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
      proxyRes.pipe(clientRes);
    }
  );

  proxyReq.setTimeout(0);

  proxyReq.on('error', (error) => {
    console.error(`[proxy] ${clientReq.method} ${clientReq.url} failed: ${error.message}`);
    clientRes.writeHead(502, { 'Content-Type': 'application/json' });
    clientRes.end(JSON.stringify({ message: error.message }));
  });

  clientReq.pipe(proxyReq);
});

server.requestTimeout = 0;
server.headersTimeout = 0;
server.timeout = 0;
server.keepAliveTimeout = 0;

server.listen(listenPort, listenHost, () => {
  console.log(`Proxy listening on http://${listenHost}:${listenPort}`);
  console.log(`Forwarding to http://${targetHost}:${targetPort}`);
});
