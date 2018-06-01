var QUnit = require("steal-qunit");
var observe = require("can-observe");
var canReflect = require("can-reflect");
var canSymbol = require("can-symbol");
var makeObject = require("../src/-make-object");
var SimpleMap = require("can-simple-map");
var SimpleObservable = require("can-simple-observable");

var observableSymbol = canSymbol.for("can.meta");

// These tests should make sure our proxied objects behave just like normal objects
QUnit.module("can-observe Objects");

QUnit.test("makeObject basics", function() {
	var person = makeObject.observable({}, {
		observe: makeObject.observable
	});
	person.first = "Justin";
	person.last = "Meyer";

	canReflect.onKeyValue(person, "first", function(newVal) {
		QUnit.equal(newVal, "Vyacheslav");
	});

	person.first = "Vyacheslav";
});

QUnit.test("reading properties up the prototype chain does not set property", function() {
	var fooObj = {
		bar: "zed"
	};
	var obj = observe(Object.create({
		foo: fooObj
	}));

	var foo = obj.foo;
	QUnit.deepEqual(foo, fooObj);
	QUnit.notOk(obj.hasOwnProperty("foo"), "no foo property");
});

QUnit.test("proxy on prototype gets, sets and deletes correctly", function() {
	var root = observe({
		foo: "bar"
	});
	var obj = Object.create(root);

	QUnit.notOk(obj.hasOwnProperty("foo"), "no foo property on parent");

	QUnit.equal(obj.foo, "bar", "reads foo");

	obj.prop = "value";
	QUnit.ok(obj.hasOwnProperty("prop"), "set prop on parent");
	QUnit.equal(obj.prop, "value", "reads prop");

	delete obj.prop;
	QUnit.ok(!obj.hasOwnProperty("prop"), "set prop deleted on parent");

	obj.foo = "ZED";
	QUnit.ok(obj.hasOwnProperty("foo"), "foo property on parent");
	delete obj.foo;
	QUnit.notOk(obj.hasOwnProperty("foo"), "no foo property on parent");
	QUnit.equal(obj.foo, "bar", "reads foo");
});




QUnit.test("Should not duplicate proxies #21", function() {
	var a = {
			who: 'a'
		},
		b = {
			who: 'b'
		},
		c = {
			who: 'c'
		},
		d = {
			who: 'd'
		};

	var aproxy = observe(a);
	var cproxy = observe(c);

	aproxy.b = b;
	cproxy.b = b;
	var dproxy = observe(d);
	var dproxy2 = observe(d);

	QUnit.equal(dproxy, dproxy2, "proxied objects should not be duplicated");
	QUnit.equal(aproxy.b, cproxy.b, "nested proxied objects should not be duplicated");
});


QUnit.test("Should not duplicate proxies in a cycle #21", function() {
	var a = {
			who: 'a'
		},
		b = {
			who: 'b'
		},
		c = {
			who: 'c'
		};

	a.b = b;
	b.c = c;
	c.a = a;

	observe(a);

	QUnit.equal(c.a, a, "proxied objects should not be duplicated");
});

QUnit.test("Should convert nested objects to observables in a lazy way (get case) #21", function() {
	var nested = {};
	var obj = {
		nested: nested
	};
	var obs = observe(obj);

	QUnit.ok(!canReflect.isObservableLike(nested), "nested is not converted before read");
	QUnit.equal(Object.getOwnPropertySymbols(nested).indexOf(observableSymbol), -1, "nested is not observed");
	QUnit.equal(canReflect.isObservableLike(obs.nested), true, "nested is converted to a proxy and the proxy returned");
	QUnit.ok(!canReflect.isObservableLike(nested), "nested is not converted after read");
	QUnit.equal(obs.nested, observe(nested), "converted to same observable");
});

QUnit.test("Should convert nested objects to observables (set case) #21", function() {
	var nested = {};
	var obj = {};
	var obs = observe(obj);

	QUnit.ok(!canReflect.isObservableLike(nested), "nested is not converted before set");
	QUnit.equal(Object.getOwnPropertySymbols(nested).indexOf(observableSymbol), -1, "nested is not observed");
	obs.nested = nested;
	QUnit.equal(canReflect.isObservableLike(obs.nested), true, "nested is converted to a proxy and the proxy returned");
	QUnit.ok(!canReflect.isObservableLike(nested), "nested is not converted after set");
	QUnit.equal(obs.nested, observe(nested), "converted to same observable");
});



QUnit.skip("can.* symbols should not appear on object", function() {
	var a = {};
	var o = observe(a);

	var objectSymbols = Object.getOwnPropertySymbols(a);
	QUnit.deepEqual(objectSymbols.filter(function(sym) {
		return sym !== observableSymbol && canSymbol.keyFor(sym).indexOf("can.") === 0;
	}), [], "No can.* symbols on object");

	var observeSymbols = Object.getOwnPropertySymbols(o);
	QUnit.ok(observeSymbols.indexOf(observableSymbol) > -1, "Meta symbol on observe");
	QUnit.ok(observeSymbols.filter(function(sym) {
		return sym !== observableSymbol && canSymbol.keyFor(sym).indexOf("can.") === 0;
	}).length > 0, "Some other can.* symbols on observe");

});

QUnit.test("Symbols can be retrieved with getOwnPropertyDescriptor", function() {
	var o = observe({});

	Object.getOwnPropertySymbols(o).forEach(function(sym){
		var desc = Object.getOwnPropertyDescriptor(o, sym);
		QUnit.ok(!!desc, "There is a descriptor");
	});
});

QUnit.test("don't wrap observable value, maps or lists", function(){
	var simpleObservable = new SimpleObservable(1),
		simpleMap = new SimpleMap();
	var observable = observe({
		simpleObservable: simpleObservable,
		simpleMap: simpleMap
	});

	QUnit.equal(observable.simpleObservable,simpleObservable, "simpleObservable left alone" );
	QUnit.equal(observable.simpleMap,simpleMap, "simpleMap left alone" );
});
