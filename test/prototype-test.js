var QUnit = require("steal-qunit");

var makePrototype = require("../src/-make-prototype");

var canReflect = require("can-reflect");

QUnit.module("can-observe prototype");

QUnit.test("makePrototype basics", function(assert) {
	function Obj() {}
	Obj.prototype = makePrototype.observable(Object.create(Obj.prototype), {
		observe: makePrototype.observable
	});
	var o = new Obj();

	var sets = 0;
	canReflect.onKeyValue(o, "fullName", function(value) {
		if (++sets === 1) {
			QUnit.equal(value, "Kevin");
		} else {
			QUnit.equal(value, "Connor");
		}
	});

	o.fullName = "Kevin";
	o.fullName = "Connor";
});

var classSupport = (function() {
	try {
		eval('"use strict"; class A{};');
		return true;
	} catch (e) {
		return false;
	}

})();

if(classSupport) {
	QUnit.test("makePrototype basics with class", function(assert){
		function El() {
			return Reflect.construct(HTMLElement, [], this.constructor);
		}
		El.prototype = makePrototype.observable(Object.create(HTMLElement.prototype), {
			observe: makePrototype.observable
		});

		class MyElement extends El {}
		customElements.define("my-basic-observable-el", MyElement); // jshint ignore:line

		var el = new MyElement();

		var sets = 0;
		canReflect.onKeyValue(el, "fullName", function(value) {
			if (++sets === 1) {
				QUnit.equal(value, "Kevin");
			} else {
				QUnit.equal(value, "Connor");
			}
		});

		el.fullName = "Kevin";
		el.fullName = "Connor";
	});

	QUnit.test("makePrototype class with getters", function(assert){
		function El() {
			return Reflect.construct(HTMLElement, [], this.constructor);
		}
		El.prototype = makePrototype.observable(Object.create(HTMLElement.prototype), {
			observe: makePrototype.observable
		});

		class MyElement extends El {
			constructor() {
				super();
				this._fullName = "Kevin";
			}

			get fullName() {
				return this._fullName + "!";
			}
		}
		customElements.define("my-observable-el-with-getters", MyElement); // jshint ignore:line

		var el = new MyElement();

		assert.equal(el.fullName, "Kevin!", "el.fullName correct");
	});

	QUnit.test("makePrototype class with getters and setters", function(assert){
		function El() {
			return Reflect.construct(HTMLElement, [], this.constructor);
		}
		El.prototype = makePrototype.observable(Object.create(HTMLElement.prototype), {
			observe: makePrototype.observable
		});

		class MyElement extends El {
			constructor() {
				super();
				this._fullName = "Kevin";
			}

			get fullName() {
				return this._fullName;
			}

			set fullName(val) {
				this._fullName = val + "!";
			}
		}
		customElements.define("my-observable-el-with-getters-and-setters", MyElement); // jshint ignore:line

		var el = new MyElement();

		canReflect.onKeyValue(el, "fullName", function(value) {
			assert.equal(value, "Marty!", "fullName event dispatched with correct value");
		});

		el.fullName = "Marty";

		assert.equal(el.fullName, "Marty!", "el.fullName correct");
	});

	QUnit.skip("makePrototype class with getter or setter that shadows a property on the prototype", function(assert){
		function El() {
			return Reflect.construct(HTMLElement, [], this.constructor);
		}
		El.prototype = makePrototype.observable(Object.create(HTMLElement.prototype), {
			observe: makePrototype.observable
		});

		class MyElement extends El {
			constructor() {
				super();
				this._name = "Kevin";
			}

			get name() {
				return this._name;
			}

			set name(val) {
				this._name = val + "!";
			}
		}
		customElements.define("my-observable-el-with-shadow-getter-or-setter", MyElement); // jshint ignore:line

		var el = new MyElement();

		canReflect.onKeyValue(el, "name", function(value) {
			assert.equal(value, "Marty!", "name event dispatched with correct value");
		});

		el.name = "Marty";

		assert.equal(el.name, "Marty!", "el.name correct");
	});

	QUnit.test("makePrototype class can use DOM properties", function(assert){
		function El() {
			return Reflect.construct(HTMLElement, [], this.constructor);
		}
		El.prototype = makePrototype.observable(Object.create(HTMLElement.prototype), {
			observe: makePrototype.observable
		});

		class MyElement extends El {
			connectedCallback() {
				this.innerHTML = "Hello ";
				var text = document.createTextNode("World");
				this.appendChild(text);
			}
		}
		customElements.define("my-observable-el-with-dom", MyElement); // jshint ignore:line

		var el = document.createElement("my-observable-el-with-dom");
		var fixture = document.querySelector("#qunit-fixture");
		fixture.appendChild(el);

		assert.equal(el.innerHTML, "Hello World");
	});
}
