var QUnit =  require("steal-qunit");
var assert = QUnit.assert;
var compute = require("can-compute");
var observe = require("can-observe");
var stache = require("can-stache");
var canBatch = require("can-event/batch/batch");
var canReflect = require("can-reflect");
var canSymbol = require("can-symbol");
var Observation = require("can-observation");

var observableSymbol = canSymbol.for("can.meta");

QUnit.module("basics");

QUnit.test("basics with object", function(){
	var person = observe({});
	person.first = "Justin";
	person.last = "Meyer";


	canReflect.onKeyValue(person, "first", function(newVal) {
		QUnit.equal(newVal, "Vyacheslav");
	});

	person.first = "Vyacheslav";
});

QUnit.test("basics with object and compute", function(){
	var person = observe({});
	person.first = "Justin";
	person.last = "Meyer";

	var fullName = compute(function(){
		return person.first+" "+person.last;
	});

	QUnit.stop();

	canReflect.onValue(fullName, function(newVal) {
		QUnit.start();
		QUnit.equal(newVal, "Vyacheslav Egorov");
	});

	// causes change event above
	canBatch.start();
	person.first = "Vyacheslav";
	person.last = "Egorov";
	canBatch.stop();
});

QUnit.test("basics with array", function(){
	var hobbies = observe(["basketball","programming"]);

	var hobbiesList = compute(function(){
		return hobbies.join(",");
	});

	canReflect.onValue(hobbiesList, function(newVal) {
		QUnit.equal(newVal, "basketball");
	});

	// causes change event above
	hobbies.pop();
});

QUnit.test("compose to stache", function(){
	var person = observe({first: "Marshall", last: "Thompson"});
	var hobbies = observe(["music","programming"]);


	var fullName = function(){
		return person.first + " " + person.last;
	};
	var hobbiesList = function(){
		return hobbies.join(",");
	};

	var info = function(){
		return fullName() + " likes: "+hobbiesList();
	};

	var frag = stache("<span>{{info}}</span>")({info: info});

	QUnit.equal(frag.firstChild.innerHTML, "Marshall Thompson likes: music,programming");

	hobbies.pop();
	person.first = "Justin";
	person.last = "Meyer";

	QUnit.equal(frag.firstChild.innerHTML, "Justin Meyer likes: music");
});

QUnit.test("events aren't fired if the value doesn't change", function(){
	var dog = observe({name: "Wilbur"});

	var events = 0;
	canReflect.onKeyValue(dog, "name", function(){
		events++;
	});

	dog.name = "Fido";
	QUnit.equal(events, 1, "there has been one event");

	dog.name = "Fido";
	QUnit.equal(events, 1, "still just one");

	dog.name = "Wilbur";
	QUnit.equal(events, 2, "now there is two");
});

QUnit.test("Should not duplicate proxies #21", function(){
	var a = {who: 'a'},
	b = {who: 'b'},
	c = {who: 'c'},
	d = {who: 'd'};

	var aproxy = observe(a);
	var cproxy = observe(c);

	aproxy.b = b;
	cproxy.b = b;
	var dproxy = observe(d);
	var dproxy2 = observe(d);

	QUnit.equal(dproxy, dproxy2, "proxied objects should not be duplicated");
	QUnit.equal(aproxy.b, cproxy.b, "nested proxied objects should not be duplicated");
});

QUnit.test("Should not duplicate proxies in a cycle #21", function(){
	var a = {who: 'a'},
	b = {who: 'b'},
	c = {who: 'c'};

	a.b = b;
	b.c = c;
	c.a = a;

	observe(a);

	QUnit.equal(c.a, a, "proxied objects should not be duplicated");
});

QUnit.test("Should convert nested objects to observables in a lazy way (get case) #21", function(){
	var nested = {};
	var obj = {nested: nested};
	var obs = observe(obj);

	QUnit.ok(!canReflect.isObservableLike(nested), "nested is not converted before read");
	QUnit.equal(Object.getOwnPropertySymbols(nested).indexOf(observableSymbol), -1, "nested is not observed");
	QUnit.equal(canReflect.isObservableLike(obs.nested), true, "nested is converted to a proxy and the proxy returned");
	QUnit.ok(!canReflect.isObservableLike(nested), "nested is not converted after read");
	QUnit.ok(Object.getOwnPropertySymbols(nested).indexOf(observableSymbol) > -1, "nested is now observed");
});

QUnit.test("Should convert nested arrays to observables in a lazy way (get case) #21", function(){
	var nested = [];
	var obj = {nested: nested};
	var obs = observe(obj);

	QUnit.ok(!canReflect.isObservableLike(nested), "nested is not converted before read");
	QUnit.equal(Object.getOwnPropertySymbols(nested).indexOf(observableSymbol), -1, "nested is not observed");
	QUnit.equal(canReflect.isObservableLike(obs.nested), true, "nested is converted to a proxy and the proxy returned");
	QUnit.ok(!canReflect.isObservableLike(nested), "nested is not converted after read");
	QUnit.ok(Object.getOwnPropertySymbols(nested).indexOf(observableSymbol) > -1, "nested is now observed");
});

QUnit.test("Should convert nested objects to observables (set case) #21", function(){
	var nested = {};
	var obj = {};
	var obs = observe(obj);

	QUnit.ok(!canReflect.isObservableLike(nested), "nested is not converted before set");
	QUnit.equal(Object.getOwnPropertySymbols(nested).indexOf(observableSymbol), -1, "nested is not observed");
	obj.nested = nested;
	QUnit.equal(canReflect.isObservableLike(obs.nested), true, "nested is converted to a proxy and the proxy returned");
	QUnit.ok(!canReflect.isObservableLike(nested), "nested is not converted after set");
	QUnit.ok(Object.getOwnPropertySymbols(nested).indexOf(observableSymbol) > -1, "nested is now observed");
});

QUnit.test("Should convert nested arrays to observables (set case) #21", function(){
	var nested = [];
	var obj = {};
	var obs = observe(obj);

	QUnit.ok(!canReflect.isObservableLike(nested), "nested is not converted before set");
	QUnit.equal(Object.getOwnPropertySymbols(nested).indexOf(observableSymbol), -1, "nested is not observed");
	obj.nested = nested;
	QUnit.equal(canReflect.isObservableLike(obs.nested), true, "nested is converted to a proxy and the proxy returned");
	QUnit.ok(!canReflect.isObservableLike(nested), "nested is not converted after set");
	QUnit.ok(Object.getOwnPropertySymbols(nested).indexOf(observableSymbol) > -1, "nested is now observed");
});

QUnit.test("Should convert properties if bound #21", function() {
	var nested = {nested: 'obj'};
	var obj = {top: 'obj'};
	var obs = observe(obj);
	canReflect.onKeyValue(obs, "nested", function(newVal) {
		QUnit.ok(Object.getOwnPropertySymbols(newVal).indexOf(observableSymbol) > -1, "nested is now observed");
	});

	obs.nested = nested;
});

QUnit.test("Nested objects should be observables #21", function() {
	expect(1);
	var obj = {nested: {}, primitive: 2};
	var obs = observe(obj);
	obs.nested.prop = 1;
	canReflect.onKeyValue(obs.nested, "prop", function(newVal) {
		assert.ok(newVal === "abc", "change is triggered on a nested property");
	});
	var x = obs.nested;
	x.prop = "abc";
});

QUnit.test("not yet defined properties can be observed on read", function() {
	var a = observe({});
	var o = new Observation(function() {
		QUnit.ok(!("foo" in a), "property is not on the object");
		return a.foo;
	});
	o.start();
	QUnit.equal(canReflect.getValue(o), undefined, "initial value is undefined");
	QUnit.equal(o.newObserved[a._cid + "|foo"].obj, a, "observation listened on property");
	o.stop();
});

QUnit.test("not yet defined properties cannot be observed on sealed object", function() {
	var b = {};
	var a = observe(b);
	var o = new Observation(function() {
		QUnit.ok(!("foo" in a), "property is not on the object");
		return a.foo;
	});
	Object.seal(b);
	o.start();
	QUnit.equal(canReflect.getValue(o), undefined, "initial value is undefined");
	QUnit.deepEqual(o.newObserved, {}, "observation is empty");
	o.stop();
});

QUnit.test("_cid cannot be observed", function() {
	var a = observe({});
	var o = new Observation(function() {
		QUnit.ok("_cid" in a, "property is on the object");
		return a._cid;
	});
	o.start();
	QUnit.equal(canReflect.getValue(o), a._cid, "initial value is cid");
	QUnit.deepEqual(o.newObserved, {}, "observation is empty");
	o.stop();
});

QUnit.test("Should remove event handlers #21", function() {
	var result = '';
	var obj = {nested: {prop:''}};
	var obs = observe(obj);

	var handler1 = function(newVal) {
		result += '1';
	};

	var handler2 = function(newVal) {
		result += '2';
	};

	var handler3 = function(newVal) {
		result += '3';
	};

	var handler4 = function(newVal) {
		result += '4';
	};

	canReflect.onKeyValue(obs.nested, "prop", handler1);
	canReflect.onKeyValue(obs.nested, "prop", handler2);
	canReflect.onKeyValue(obs.nested, "prop", handler3);
	var x = obs.nested;
	x.prop = "abc"; //should add '123' to result

	canReflect.offKeyValue(obs.nested, "prop", handler2);
	x.prop = "xyz"; //should add '13' to result

	canReflect.onKeyValue(obs.nested, "prop", handler4);
	canReflect.offKeyValue(obs.nested, "prop", handler1);
	x.prop = "cba"; //should add '34' to result

	QUnit.equal(result, '1231334', 'Should be able to add and remove handlers');
});

QUnit.test("Other can.* symbols should not appear on object", function() {
	var a = {};
	var o = observe(a);

	var objectSymbols = Object.getOwnPropertySymbols(a);
	QUnit.ok(objectSymbols.indexOf(observableSymbol) > -1, "Observable symbol in object");
	QUnit.deepEqual(objectSymbols.filter(function(sym) {
		return sym !== observableSymbol && canSymbol.keyFor(sym).indexOf("can.") === 0;
	}), [], "No other can.* symbols on object");

	var observeSymbols = Object.getOwnPropertySymbols(o);
	QUnit.ok(observeSymbols.indexOf(observableSymbol) > -1, "Observable symbol in observe");
	QUnit.ok(observeSymbols.filter(function(sym) {
		return sym !== observableSymbol && canSymbol.keyFor(sym).indexOf("can.") === 0;
	}).length > 0, "Some other can.* symbols on observe");

});

QUnit.skip("getters can be bound within observes", function() {
	expect(5);
	var count = 0;
	var o = observe({
		get b() {
			QUnit.ok(count <= 4, "hit the getter " + (++count) + " of 4");
			return this.c;
		},
		c: "d"
	});

	var fn;
	canReflect.onKeyValue(o, "b", fn = function(){
		QUnit.ok(true, "Hit the updater");
	}); // Also reads b's getter, #1

	var d = o.b; // #2
	o.c = "e"; // #3

	// After offKeyValue these shouldn't trigger more updader calls.
	canReflect.offKeyValue(o, "b", fn);
	d = o.b; // #4
	// This won't trigger b's getter or the updater now.
	o.c = "f";
});

QUnit.skip("getters can be bound across observes", function() {
	expect(5);
	var count = 0;
	var b = observe({ c: "d" });
	var o = observe({
		get b() {
			QUnit.ok(count <= 4, "hit the getter " + (++count) + " of 4");
			return b.c;
		}
	});

	var fn;
	canReflect.onKeyValue(o, "b", fn = function(){
		QUnit.ok(true, "Hit the updater");
	}); // Also reads b's getter, #1

	var d = o.b; // #2
	b.c = "e"; // #3

	// After offKeyValue these shouldn't trigger more updader calls.
	canReflect.offKeyValue(o, "b", fn);
	d = o.b; // #4
	// This won't trigger b's getter or the updater now.
	b.c = "f";
});

QUnit.skip("getter/setters within observes", function() {
	expect(7);
	var getCount = 0, setCount = 0;
	var o = observe({
		get b() {
			QUnit.ok(getCount <= 4, "hit the getter " + (++getCount) + " of 4");
			return this.c;
		},
		set b(val) {
			QUnit.ok(setCount <= 2, "Setter was called " + (++setCount) + " of 2"); //x2
			this.c = val;
		},
		c: "d"
	});

	var fn;
	canReflect.onKeyValue(o, "b", fn = function(){
		QUnit.ok(true, "Hit the updater");
	}); // Also reads b's getter, #1

	var d = o.b; // #2
	o.b = "e"; // #3, set #1

	// After offKeyValue these shouldn't trigger more updader calls.
	canReflect.offKeyValue(o, "b", fn);
	d = o.b; // #4
	// This won't trigger b's getter or the updater now.
	o.b = "f"; // set #2
});

QUnit.test("deleting a property", function() {
	expect(3);
	var o = observe({
		get b() {
			QUnit.ok(true, "hit the getter");
			return this.c;
		},
		set b(val) {
			QUnit.ok(false, "Setter was called");
			this.c = val;
		},
		c: "d"
	});

	canReflect.onKeyValue(o, "b", function(newVal){
		QUnit.equal(newVal, undefined, "Hit the updater for getter/setter");
	}); // Also reads b's getter, #1

	canReflect.onKeyValue(o, "c", function(newVal){
		QUnit.equal(newVal, undefined, "Hit the updater for value");
	}); // Does not read b's getter so long as getters aren't treated specially.

	delete o.b;
	delete o.c;
});

QUnit.test("add events with addEventListener", function() {
	var o = observe({});

	o.addEventListener("foo", function(ev, newVal) {
		QUnit.ok(true, "event handler fired");
		QUnit.equal(newVal, 1, "correct positions");
	});
	o.dispatch( "foo", [1]);
	o.foo = 2; // onKeyValue and addEventListener do not overlap;
});

QUnit.test("remove events with removeEventListener", function() {
	var o = observe({});
	var fn;

	o.addEventListener("foo", fn = function(ev, newVal) {
		QUnit.ok(false, "event handler fired");
	});

	o.removeEventListener("foo", fn);
	o.dispatch( "foo", [1]);
	QUnit.ok(true, "finished");
});

QUnit.test("array events are automatically triggered (push/pop)", function() {
	expect(4);
	var list = observe([1, 2]);
	var newThing = 3;

	function addHandler(ev, items, index) {
		QUnit.deepEqual(items, [newThing], "new thing added");
		QUnit.equal(index, list.length - 1, "new thing added at end");
	}
	function removeHandler(ev, items, index) {
		QUnit.deepEqual(items, [newThing], "new thing removed");
		QUnit.equal(index, list.length, "new thing removed from end");
	}

	list.addEventListener("add", addHandler);
	list.addEventListener("remove", removeHandler);

	list.push(newThing);
	list.pop();
});

QUnit.test("array events are automatically triggered (shift/unshift)", function() {
	expect(4);
	var list = observe([1, 2]);
	var newThing = 3;

	function addHandler(ev, items, index) {
		QUnit.deepEqual(items, [newThing], "new thing added");
		QUnit.equal(index, 0, "new thing added at beginning");
	}
	function removeHandler(ev, items, index) {
		QUnit.deepEqual(items, [newThing], "new thing removed");
		QUnit.equal(index, 0, "new thing removed from beginning");
	}

	list.addEventListener("add", addHandler);
	list.addEventListener("remove", removeHandler);

	list.unshift(newThing);
	list.shift();
});

QUnit.test("array events are automatically triggered (splice)", function() {
	expect(4);
	var list = observe([1, 2, 3]);
	var newThing = 4;
	var oldThing = list[1];

	function addHandler(ev, items, index) {
		QUnit.deepEqual(items, [newThing], "new thing added");
		QUnit.equal(index, 1, "new thing added at index 1");
	}
	function removeHandler(ev, items, index) {
		QUnit.deepEqual(items, [oldThing], "new thing removed");
		QUnit.equal(index, 1, "old thing removed from index 1");
	}

	list.addEventListener("add", addHandler);
	list.addEventListener("remove", removeHandler);

	list.splice(1, 1, newThing);
});

QUnit.test("array events are automatically triggered (sort)", function() {
	expect(4);
	var list = observe(["a", "c", "b"]);
	var oldList = list.slice(0);

	function addHandler(ev, items, index) {
		QUnit.deepEqual(items, list, "new list added");
		QUnit.equal(index, 0, "new list added at index 0");
	}
	function removeHandler(ev, items, index) {
		QUnit.deepEqual(items, oldList, "all old things removed");
		QUnit.equal(index, 0, "all old things removed from the beginning");
	}

	list.addEventListener("add", addHandler);
	list.addEventListener("remove", removeHandler);

	list.sort();
});

QUnit.test("array events are automatically triggered (reverse)", function() {
	expect(4);
	var list = observe(["a", "b", "c"]);
	var oldList = list.slice(0);

	function addHandler(ev, items, index) {
		QUnit.deepEqual(items, list, "new list added");
		QUnit.equal(index, 0, "new list added at index 0");
	}
	function removeHandler(ev, items, index) {
		QUnit.deepEqual(items, oldList, "all old things removed");
		QUnit.equal(index, 0, "all old things removed from the beginning");
	}

	list.addEventListener("add", addHandler);
	list.addEventListener("remove", removeHandler);

	list.reverse();
});

QUnit.test("non-mutating array -> array functions return proxied arrays", function() {
	var list = observe([0,2,3]);
	QUnit.ok(list.map(function(x) { return x + 1; })[observableSymbol], "Map returns proxy");
	QUnit.ok(list.filter(function(x) { return x; })[observableSymbol], "Filter returns proxy");
	QUnit.ok(list.slice(0)[observableSymbol], "Slice returns proxy");
	QUnit.ok(list.concat([5, 6])[observableSymbol], "Concat returns proxy");
});

QUnit.test("non-mutating reduce functions return proxied objects", function() {
	var list = observe([0,2,3]);
	QUnit.ok(list.reduce(function(a, b) { a[b] = true; return a; }, {})[observableSymbol], "Reduce returns proxy");
	QUnit.ok(list.reduceRight(function(a, b) { a[b] = true; return a; }, {})[observableSymbol], "ReduceRight returns proxy");
});

QUnit.test("custom, non-array functions return proxied objects as well", function() {
	var p = observe({
		foo: function() {
			return {};
		}
	});

	QUnit.ok(p.foo()[observableSymbol], "Proxied function returns proxy");
});

QUnit.test("custom, non-array functions can be redefined", function() {
	expect(1);
	var p = observe({
		foo: function() {
			QUnit.ok(true, "first function called");
		}
	});

	p.foo();
	p.foo = function() {};
	p.foo();
});
