/* global Ultraviolet */
// Paths are worked out from where this folder lives, so the site works both at
// username.github.io/ and at username.github.io/repo-name/.
(function () {
  let path = self.location.pathname;
  // Pages outside /uv/ (like proxy.html) find the folder from this script's own address.
  if (path.indexOf('/uv/') === -1 && self.document && document.currentScript) {
    path = new URL(document.currentScript.src).pathname;
  }
  const base = path.slice(0, path.indexOf('/uv/') + 4);
  self.__uv$config = {
    prefix: base + 'service/',
    encodeUrl: Ultraviolet.codec.xor.encode,
    decodeUrl: Ultraviolet.codec.xor.decode,
    handler: base + 'uv.handler.js',
    client: base + 'uv.client.js',
    bundle: base + 'uv.bundle.js',
    config: base + 'uv.config.js',
    sw: base + 'uv.sw.js',
  };
})();
