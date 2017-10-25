var QUnit =  require("steal-qunit");
var assert = QUnit.assert;
var observe = require("can-observe");
var queues = require("can-queues");
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

QUnit.test("basics with object and new Observation", function(){
	var person = observe({});
	person.first = "Justin";
	person.last = "Meyer";

	var fullName = new Observation(function(){
		return person.first+" "+person.last;
	});

	QUnit.stop();

	canReflect.onValue(fullName, function(newVal) {
		QUnit.start();
		QUnit.equal(newVal, "Vyacheslav Egorov");
	});

	// causes change event above
	queues.batch.start();
	person.first = "Vyacheslav";
	person.last = "Egorov";
	queues.batch.stop();
});

QUnit.test("basics with array", function(){
	var hobbies = observe(["basketball","programming"]);

	var hobbiesList = new Observation(function(){
		return hobbies.join(",");
	});

	canReflect.onValue(hobbiesList, function(newVal) {
		QUnit.equal(newVal, "basketball");
	});

	// causes change event above
	hobbies.pop();
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
	QUnit.equal(canReflect.isObservableLike(obs.nested), false, "nested is not converted to a proxy before being observed");
	canReflect.onKeyValue(obs, "nested", function() {});
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
	QUnit.equal(canReflect.isObservableLike(obs.nested), false, "nested is not converted to a proxy before being observed");
	canReflect.onKeyValue(obs, "nested", function() {});
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
	obs.nested = nested;
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
	obs.nested = nested;
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
	canReflect.onKeyValue(obs, "nested", function() {});
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
	QUnit.ok(canReflect.getValueDependencies(o).keyDependencies.get(a).has("foo"), "observation listened on property");
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
	QUnit.ok(!canReflect.valueHasDependencies(o), "observation is empty");
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
	QUnit.equal(o.newDependencies.keyDependencies.size, 0, "observation is empty");
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

	canReflect.onKeyValue(obs, "nested");
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

QUnit.test("array events are automatically triggered (push)", function() {
	expect(4);
	var list = observe([1, 2]);
	var newThing = 3;

	list[canSymbol.for("can.onPatches")](function(patches) {
		if(patches[0].property) { return; } // ignore length property patches
		QUnit.equal(patches.length, 1, "One patches generated");
		QUnit.equal(patches[0].deleteCount, 0, "nothing removed");
		QUnit.equal(patches[0].index, list.length - 1, "new thing added to end");
		QUnit.deepEqual(patches[0].insert, [newThing], "new thing added to end");
	});

	list.push(newThing);
});

QUnit.test("array events are automatically triggered (pop)", function() {
	expect(3);
	var list = observe([1, 2, 3]);

	list[canSymbol.for("can.onPatches")](function(patches) {
		if(patches[0].property) { return; } // ignore length property patches
		QUnit.equal(patches.length, 1, "One patches generated");
		QUnit.equal(patches[0].deleteCount, 1, "old thing removed");
		QUnit.equal(patches[0].index, list.length, "old thing removed from end");
	});

	list.pop();
});

QUnit.test("array events are automatically triggered (unshift)", function() {
	expect(4);
	var list = observe([1, 2]);
	var newThing = 3;

	list[canSymbol.for("can.onPatches")](function(patches) {
		if(patches[0].property) { return; } // ignore length property patches
		QUnit.equal(patches.length, 1, "One patches generated");
		QUnit.equal(patches[0].deleteCount, 0, "nothing removed");
		QUnit.equal(patches[0].index, 0, "new thing added to beginning");
		QUnit.deepEqual(patches[0].insert, [newThing], "new thing added to beginning");
	});

	list.unshift(newThing);
});

QUnit.test("array events are automatically triggered (shift)", function() {
	expect(3);
	var list = observe([1, 2, 3]);

	list[canSymbol.for("can.onPatches")](function(patches) {
		if(patches[0].property) { return; } // ignore length property patches
		QUnit.equal(patches.length, 1, "One patches generated");
		QUnit.equal(patches[0].deleteCount, 1, "old thing removed");
		QUnit.equal(patches[0].index, 0, "old thing removed from beginning");
	});

	list.shift();
});

QUnit.test("array events are automatically triggered (splice)", function() {
	expect(4);
	var list = observe([1, 2, 3]);
	var newThing = 4;

	list[canSymbol.for("can.onPatches")](function(patches) {
		if(patches[0].property) { return; } // ignore length property patches
		QUnit.equal(patches.length, 1, "One patches generated");
		QUnit.equal(patches[0].deleteCount, 1, "nothing removed");
		QUnit.equal(patches[0].index, 1, "new thing added to beginning");
		QUnit.deepEqual(patches[0].insert, [newThing], "new thing added to beginning");
	});

	list.splice(1, 1, newThing);
});

QUnit.test("array events are automatically triggered (sort)", function() {
	expect(1);
	var list = observe(["a", "c", "b"]);

	list[canSymbol.for("can.onPatches")](function(patches) {
		if(patches[0].property) { return; } // ignore length property patches
		QUnit.deepEqual(patches, [
			{"index":1,"deleteCount":0,"insert":["b"]},
			{"index":3,"deleteCount":1,"insert":[]}
		], "patches correct");
	});

	list.sort();
});

QUnit.test("array events are automatically triggered (reverse)", function() {
	expect(1);
	var list = observe(["a", "b", "c"]);

	var expectedList = list.slice(0).reverse();

	list[canSymbol.for("can.onPatches")](function(patches) {
		if(patches[0].property) { return; } // ignore length property patches
		QUnit.deepEqual(patches, [
			{"index":0,"deleteCount":3,"insert":expectedList}
		], "patches replaces whole list");
	});

	list.reverse();
});

QUnit.test("patches events for keyed properties on objects", function() {
	expect(9);
	var addObject = observe({});
	var setObject = observe({ a: 1 });
	var removeObject = observe({a: 1});

	addObject[canSymbol.for("can.onPatches")](function(patches) {
		QUnit.equal(patches[0].property, "a");
		QUnit.equal(patches[0].type, "add");
		QUnit.equal(patches[0].value, 1);
	});
	addObject.a = 1;
	setObject[canSymbol.for("can.onPatches")](function(patches) {
		QUnit.equal(patches[0].property, "a");
		QUnit.equal(patches[0].type, "set");
		QUnit.equal(patches[0].value, 2);
	});
	setObject.a = 2;
	removeObject[canSymbol.for("can.onPatches")](function(patches) {
		QUnit.equal(patches[0].property, "a");
		QUnit.equal(patches[0].type, "remove");
		QUnit.ok(!patches[0].value);
	});
	delete removeObject.a;

});

QUnit.test("patches events for keyed properties on arrays", function() {
	expect(9);
	var addObject = observe([]);
	var setObject = observe([]);
	setObject.a = 1;
	var removeObject = observe([]);
	removeObject.a = 1;

	addObject[canSymbol.for("can.onPatches")](function(patches) {
		QUnit.equal(patches[0].property, "a");
		QUnit.equal(patches[0].type, "add");
		QUnit.equal(patches[0].value, 1);
	});
	addObject.a = 1;
	setObject[canSymbol.for("can.onPatches")](function(patches) {
		QUnit.equal(patches[0].property, "a");
		QUnit.equal(patches[0].type, "set");
		QUnit.equal(patches[0].value, 2);
	});
	setObject.a = 2;
	removeObject[canSymbol.for("can.onPatches")](function(patches) {
		QUnit.equal(patches[0].property, "a");
		QUnit.equal(patches[0].type, "remove");
		QUnit.ok(!patches[0].value);
	});
	delete removeObject.a;

});

QUnit.test("patches events for set/deleted indexed properties on arrays", function() {
	expect(10);
	var setArrayObject = observe([]);
	var deleteArrayObject = observe(["a", "b"]);
	setArrayObject[canSymbol.for("can.onPatches")](function(patches) {
		patches.forEach(function(patch) {
			if(patch.property === "length") {
				QUnit.equal(patch.type, "set");
				QUnit.equal(patch.value, 1);			
			} else {
				QUnit.equal(patch.property, "0");
				QUnit.equal(patch.type, "add");
				QUnit.equal(patch.value, "a");
			}
		});
	});
	setArrayObject[0] = "a";

	deleteArrayObject[canSymbol.for("can.onPatches")](function(patches) {
		patches.forEach(function(patch) {
			if(patch.property === "length") {
				QUnit.equal(patch.type, "set");
				QUnit.equal(patch.value, 1);
			} else {
				QUnit.equal(patch.property, "1");
				QUnit.equal(patch.type, "remove");
				QUnit.ok(!patch.value);
			}
		});
	});
	deleteArrayObject.length = 1; // deleting object at index 1 is implicit in setting length
});

QUnit.test("arrays don't listen on individual keys in comprehensions", function() {
	expect(5);
	var a = [1, 2];
	var p = observe(a);
	var o = new Observation(function() {
		return p[0];
	});
	var o2 = new Observation(function() {
		return p.map(function(b) { return b + 1; });
	});

	canReflect.onValue(o, function(newVal) {
		QUnit.equal(newVal, a[0], "Sanity check: observation on index 0");
	});
	canReflect.onValue(o2, function(newVal) {
		QUnit.deepEqual(newVal, a.map(function(b) { return b + 1; }), "Sanity check: observation on map");
	});

	QUnit.ok(p[observableSymbol].handlers.getNode(["0"]), "Handlers for directly read index");
	QUnit.ok(!p[observableSymbol].handlers.getNode(["1"]), "no handlers for indirectly read index");

	p[0] = 2;
	p[1] = 3;
 });

QUnit.test("changing an item at an array index dispatches a splice patch", function() {
	expect(3);
	var a = observe([1, 2]);

	a[canSymbol.for("can.onPatches")](function(patches) {
		patches.forEach(function(patch) {
			if(patch.property) {
				return;
			}
			QUnit.equal(patch.index, 0);
			QUnit.equal(patch.deleteCount, 1);
			QUnit.deepEqual(patch.insert, [2]);
		});
	});

	a[0] = 2;
});
