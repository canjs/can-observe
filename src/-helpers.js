var classTest = /^\s*class\s+/;
module.exports = {
	assignEverything: function(d, s) {
		Object.getOwnPropertyNames(s).concat(Object.getOwnPropertySymbols(s)).forEach(function(key) {
			d[key] = s[key];
		});
		return d;
	},
	isBuiltInButNotArrayOrPlainObject: function(obj) {
		if (Array.isArray(obj)) {
			return false;
		}
		if (typeof obj === "function") {
			var fnCode = obj.toString();
			if (fnCode.indexOf("[native code]") > 0) {
				return true;
			} else {
				return false;
			}
		} else {
			var toString = Object.prototype.toString.call(obj);
			return toString !== '[object Object]' && toString.indexOf('[object ') !== -1;
		}

	},
	inheritsFromArray: function(obj) {
		var cur = obj;
		do {
			if (Array.isArray(cur)) {
				return true;
			}
			cur = Object.getPrototypeOf(cur);
		} while (cur);
		return false;
	},
	isClass: function(obj) {
		return typeof obj === 'function' && classTest.test(obj.toString());
	}
};