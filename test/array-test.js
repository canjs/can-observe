var QUnit =  require("steal-qunit");
var assert = QUnit.assert;
var observe = require("can-observe");
var canReflect = require("can-reflect");
var canSymbol = require("can-symbol");
var Observation = require("can-observation");

var observableSymbol = canSymbol.for("can.meta");

QUnit.module("can-observe with Array");

var makeArray = require("../src/-make-array");
var makeObserve = require("../src/-make-observe");

QUnit.test("makeArray basics", function(){
	var hobbies = makeArray.observable(["basketball","programming"],makeObserve);

	var hobbiesList = new Observation(function(){
		return hobbies.join(",");
	});

	canReflect.onValue(hobbiesList, function(newVal) {
		QUnit.equal(newVal, "basketball");
	});

	// causes change event above
	hobbies.pop();
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




QUnit.test("array events are automatically triggered (push)", function() {
	expect(4);
	var list = observe([1, 2]);
	var newThing = 3;

	list[canSymbol.for("can.onPatches")](function(patches) {
		QUnit.ok(patches.length > 1, "Patches generated");
		patches.forEach(function(patch) {
			if(patch.key) { return; } // ignore length property patches
			QUnit.equal(patch.deleteCount, 0, "nothing removed");
			QUnit.equal(patch.index, list.length - 1, "new thing added to end");
			QUnit.deepEqual(patch.insert, [newThing], "new thing added to end");
		});
	});

	list.push(newThing);
});

QUnit.test("array events are automatically triggered (pop)", function() {
	expect(3);
	var list = observe([1, 2, 3]);

	list[canSymbol.for("can.onPatches")](function(patches) {
		QUnit.ok(patches.length > 1, "Patches generated");
		patches.forEach(function(patch) {
			if(patch.key) { return; } // ignore length property patches
			QUnit.equal(patch.deleteCount, 1, "old thing removed");
			QUnit.equal(patch.index, list.length, "old thing removed from end");
		});
	});

	list.pop();
});

QUnit.test("array events are automatically triggered (unshift)", function() {
	expect(4);
	var list = observe([1, 2]);
	var newThing = 3;

	list[canSymbol.for("can.onPatches")](function(patches) {
		QUnit.ok(patches.length > 1, "Patches generated");
		patches.forEach(function(patch) {
			if(patch.key) { return; } // ignore length property patches
			QUnit.equal(patch.deleteCount, 0, "nothing removed");
			QUnit.equal(patch.index, 0, "new thing added to beginning");
			QUnit.deepEqual(patch.insert, [newThing], "new thing added to beginning");
		});
	});

	list.unshift(newThing);
});

QUnit.test("array events are automatically triggered (shift)", function() {
	expect(3);
	var list = observe([1, 2, 3]);

	list[canSymbol.for("can.onPatches")](function(patches) {
		QUnit.ok(patches.length > 1, "Patches generated");
		patches.forEach(function(patch) {
			if(patch.key) { return; } // ignore length property patches
			QUnit.equal(patch.deleteCount, 1, "old thing removed");
			QUnit.equal(patch.index, 0, "old thing removed from beginning");
		});
	});

	list.shift();
});

QUnit.test("array events are automatically triggered (splice)", function() {
	expect(4);
	var list = observe([1, 2, 3]);
	var newThing = 4;

	list[canSymbol.for("can.onPatches")](function(patches) {
		QUnit.ok(patches.length > 1, "Patches generated");
		patches.forEach(function(patch) {
			if(patch.key) { return; } // ignore length property patches
			QUnit.equal(patch.deleteCount, 1, "nothing removed");
			QUnit.equal(patch.index, 1, "new thing added to beginning");
			QUnit.deepEqual(patch.insert, [newThing], "new thing added to beginning");
		});
	});

	list.splice(1, 1, newThing);
});

QUnit.test("array events are automatically triggered (sort)", function() {
	expect(1);
	var list = observe(["a", "c", "b"]);

	list[canSymbol.for("can.onPatches")](function(patches) {
		QUnit.deepEqual(patches.filter(function(p) { return !p.key; }), [
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
		QUnit.deepEqual(patches.filter(function(p) { return !p.key; }), [
			{"index":0,"deleteCount":3,"insert":expectedList}
		], "patches replaces whole list");
	});

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



QUnit.test("patches events for keyed properties on arrays", function() {
	expect(9);
	var addObject = observe([]);
	var setObject = observe([]);
	setObject.a = 1;
	var removeObject = observe([]);
	removeObject.a = 1;

	addObject[canSymbol.for("can.onPatches")](function(patches) {
		QUnit.equal(patches[0].key, "a");
		QUnit.equal(patches[0].type, "add");
		QUnit.equal(patches[0].value, 1);
	});
	addObject.a = 1;
	setObject[canSymbol.for("can.onPatches")](function(patches) {
		QUnit.equal(patches[0].key, "a");
		QUnit.equal(patches[0].type, "set");
		QUnit.equal(patches[0].value, 2);
	});
	setObject.a = 2;
	removeObject[canSymbol.for("can.onPatches")](function(patches) {
		QUnit.equal(patches[0].key, "a");
		QUnit.equal(patches[0].type, "delete");
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
			if(patch.key === "length") {
				QUnit.equal(patch.type, "set");
				QUnit.equal(patch.value, 1);
			} else {
				QUnit.equal(patch.key, "0");
				QUnit.equal(patch.type, "add");
				QUnit.equal(patch.value, "a");
			}
		});
	});
	setArrayObject[0] = "a";

	deleteArrayObject[canSymbol.for("can.onPatches")](function(patches) {
		patches.forEach(function(patch) {
			if(patch.key === "length") {
				QUnit.equal(patch.type, "set");
				QUnit.equal(patch.value, 1);
			} else {
				QUnit.equal(patch.key, "1");
				QUnit.equal(patch.type, "delete");
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
			if(patch.key) {
				return;
			}
			QUnit.equal(patch.index, 0);
			QUnit.equal(patch.deleteCount, 1);
			QUnit.deepEqual(patch.insert, [2]);
		});
	});

	a[0] = 2;
});
