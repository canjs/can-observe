if (typeof WeakSet === "undefined") {
	require("weakset/weakset");
}

if (typeof Proxy === "undefined") {
	require("proxy-polyfill/src/proxy");
}

require("./object-test");
require("./object-observability-test");
require("./object-getter-setter-test");
require("./array-test");
require("./function-test");
require("../object/object-test");
require("../array/array-test");
require("../decorators/decorators-test");
