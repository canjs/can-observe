var QUnit = require("steal-qunit");
var observe = require("can-observe");
var canReflect = require("can-reflect");
var canSymbol = require("can-symbol");
var makeFunction = require("../src/-make-function");
var makeObject = require("../src/-make-object");

var observableSymbol = canSymbol.for("can.meta");
var observableStore = require("../src/-observable-store");
var helpers = require("../src/-helpers");


QUnit.module("can-observe with Functions");


QUnit.test("isBuiltInButNotArrayOrPlainObject", function() {
	// Testing type constructors
	QUnit.equal(helpers.isBuiltInButNotArrayOrPlainObject(Function), true, "Function");
	QUnit.equal(helpers.isBuiltInButNotArrayOrPlainObject(Object), true, "Object");
	QUnit.equal(helpers.isBuiltInButNotArrayOrPlainObject(Date), true, "Date");

	QUnit.equal(helpers.isBuiltInButNotArrayOrPlainObject(function() {}), false, "function instance");

	QUnit.equal(helpers.isBuiltInButNotArrayOrPlainObject({}), false, "new Object");
	QUnit.equal(helpers.isBuiltInButNotArrayOrPlainObject([]), false, "new Array");
	QUnit.equal(helpers.isBuiltInButNotArrayOrPlainObject(new Date()), true, "new Date");
	QUnit.equal(helpers.isBuiltInButNotArrayOrPlainObject(new RegExp()), true, "new RegExp");
});

QUnit.test("makeFunction basics", 3, function() {
	var OriginalPerson = function(first, last) {
		this.first = first;
		this.last = last;
		this.constructor.count++;
	};
	OriginalPerson.prototype.sayHi = function() {
		return this.first + this.last;
	};
	var observe = function(obj) {
		if (canReflect.isPrimitive(obj)) {
			return obj;
		}
		if (observableStore.proxies.has(obj)) {
			return obj;
		}
		if (helpers.isBuiltInButNotArrayOrPlainObject(obj)) {
			return obj;
		}
		var observable;
		if (obj && typeof obj === "object") {
			observable = makeObject.observable(obj, {
				observe: observe
			});
		} else if (typeof obj === "function") {
			observable = makeFunction.observable(obj, {
				observe: observe
			});
		} else {
			return obj;
		}
		observableStore.proxies.add(observable);
		observableStore.proxiedObjects.set(obj, observable);
		return observable;
	};
	var Person = observe(OriginalPerson);
	QUnit.equal(Person.prototype.constructor, Person, "Person is its own constructor");
	Person.count = 0;



	canReflect.onKeyValue(Person, "count", function(newVal) {
		QUnit.equal(newVal, 1, "static count");
	});

	var person = new Person("Justin", "Meyer");


	canReflect.onKeyValue(person, "first", function(newVal) {
		QUnit.equal(newVal, "Vyacheslav", "first changed");
	});

	person.first = "Vyacheslav";
});


QUnit.test("custom, non-array functions return proxied objects as well", function() {
	var p = observe({
		foo: function() {
			return {};
		}
	});

	QUnit.ok(p.foo()[observableSymbol], "Proxied function returns proxy");
});


QUnit.test("basics with constructor functions", 3, function() {
	var OriginalPerson = function(first, last) {
		this.first = first;
		this.last = last;
		this.constructor.count++;
	};
	OriginalPerson.prototype.sayHi = function() {
		return this.first + this.last;
	};
	var Person = observe(OriginalPerson);
	QUnit.equal(Person.prototype.constructor, Person, "Person is its own constructor");
	Person.count = 0;



	canReflect.onKeyValue(Person, "count", function(newVal) {
		QUnit.equal(newVal, 1, "static count");
	});

	var person = new Person("Justin", "Meyer");


	canReflect.onKeyValue(person, "first", function(newVal) {
		QUnit.equal(newVal, "Vyacheslav", "first changed");
	});

	person.first = "Vyacheslav";
});


require("can-reflect-tests/observables/map-like/type/type")("simple map-like constructor", function() {
	return observe(function(props) {
		canReflect.assign(this, props || {});
	});
});

require("can-reflect-tests/observables/map-like/type/type")("observe.makeMapType", function() {
	return observe.makeMapType("MyArray",{},{});
});


QUnit.test(".constructor of array subclass is itself", function() {
	var MyArray = function(values) {
		this.push.apply(this, arguments);
	};
	MyArray.prototype = Object.create(Array.prototype);
	MyArray.prototype.constructor = MyArray;
	var ArrayType = observe(MyArray);

	QUnit.equal(ArrayType.prototype.constructor, ArrayType, "type");

	var arr = new MyArray();
	QUnit.equal(arr.constructor, ArrayType, "instance");
});


var classSupport = (function() {
	try {
		eval('"use strict"; class A{};');
		return true;
	} catch (e) {
		return false;
	}

})();

if (classSupport) {
	require("can-reflect-tests/observables/list-like/type/on-instance-patches")("class extends Array",
		function() {
			class MyArray extends Array {

			}
			return observe(MyArray);
		});

	QUnit.test("calling methods (that have no prototypes)", function(){
		class AddBase {
			constructor() {
				this.count = 0;
			}
			add(){
				this.count++;
			}
		}
		var Add = observe(AddBase);
		var add = new Add();
		add.add();
		QUnit.equal(add.count,1, "count set");
	});
}


require("can-reflect-tests/observables/list-like/type/on-instance-patches")("Object.create(Array)", function() {

	var MyArray = function(values) {
		this.push.apply(this, arguments);
	};
	MyArray.prototype = Object.create(Array.prototype);
	MyArray.prototype.constructor = MyArray;

	return observe(MyArray);
});


require("can-reflect-tests/observables/list-like/type/on-instance-patches")("observe.makeListType", function() {

	return observe.makeListType("MyArray",{},{});
});


require("can-reflect-tests/observables/list-like/type/on-instance-patches")("observe.makeListType", function() {

	return observe.makeListType("MyArray",{},{});
});

var MyArray, MyType;
require("can-reflect-tests/observables/list-like/instance/serialize")("observe.makeListType observe.makeMapType", function(values){
	if(!MyArray) {
		MyArray = observe.makeListType("MyArray",{},{})
	}
	return new MyArray(values);
}, function(values){
	if(!MyType) {
		MyType = observe.makeMapType("Type",{},{})
	}
	return new MyType(values);
});
