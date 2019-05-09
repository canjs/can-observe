var QUnit = require("steal-qunit");

var observe = require("../can-observe");
var makePrototype = require("../src/-make-prototype");

var canReflect = require("can-reflect");
var Observation  = require("can-observation");

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
			assert.equal(value, "Kevin");
		} else {
			assert.equal(value, "Connor");
		}
	});

	o.fullName = "Kevin";
	o.fullName = "Connor";
});

QUnit.test("values can be set directly on a proxied prototype", function(assert) {
	function Obj() {}
	Obj.prototype = makePrototype.observable({}, {
		observe: makePrototype.observable
	});
	//Obj.prototype.key = "value";

	throw new Error("Break up this test into 2");

	function Child() {}
	Child.prototype = Object.create(Obj.prototype);
	// Breaks here
	Child.prototype.key = "value";

	var o = new Child();

	assert.equal(o.key, "value");
});

QUnit.test("Values can be read in an observation", function(assert) {

	function Obj() {
		this.isInstance = true;
	}
	Obj.prototype = makePrototype.observable({}, {
		observe: makePrototype.observable
	});

	var o = new Obj();
	var obs = new Observation(function(){
		return o.age;
	});

	var lastValue;
	function onChange(n) {
		lastValue = n;
	}
	canReflect.onValue(obs, onChange);
	o.age = 5;
	assert.equal(lastValue, 5, "Value changed");

	o.age = 2;
	assert.equal(lastValue, 2, "Value changed");
	canReflect.offValue(obs, onChange);
});

QUnit.test("makePrototype basics with class", function(assert) {
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
			assert.equal(value, "Kevin");
		} else {
			assert.equal(value, "Connor");
		}
	});

	el.fullName = "Kevin";
	el.fullName = "Connor";
});

QUnit.test("makePrototype can create two instances of a class with different metadata", function(assert) {
	function El() {
		return Reflect.construct(HTMLElement, [], this.constructor);
	}
	El.prototype = makePrototype.observable(Object.create(HTMLElement.prototype), {
		observe: makePrototype.observable
	});

	class MyElement extends El {}
	customElements.define("my-two-instaance-observable-el", MyElement); // jshint ignore:line

	var el1 = new MyElement();
	var el2 = new MyElement();

	el1.fullName = "Kevin";
	assert.equal(el1.fullName, "Kevin", "el1.fullName is set");
	assert.equal(el2.fullName, undefined, "el2.fullName is not set");
});

QUnit.test("makePrototype class with getters", function(assert) {
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

QUnit.test("makePrototype class with getters and setters", function(assert) {
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

QUnit.skip("makePrototype class with getter or setter that shadows a property on the prototype", function(assert) {
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

QUnit.test("makePrototype class can use DOM properties", function(assert) {
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

QUnit.test("main observe function uses makePrototype for Element instances", function(assert) {
	function El() {
		return Reflect.construct(HTMLElement, [], this.constructor);
	}
	El.prototype = observe(Object.create(HTMLElement.prototype));
	class MyElement extends El {}
	customElements.define("my-main-observe-el", MyElement); // jshint ignore:line

	var el = new MyElement();

	var sets = 0;
	canReflect.onKeyValue(el, "fullName", function(value) {
		if (++sets === 1) {
			assert.equal(value, "Kevin");
		} else {
			assert.equal(value, "Connor");
		}
	});

	el.fullName = "Kevin";
	el.fullName = "Connor";
});
