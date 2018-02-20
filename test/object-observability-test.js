var QUnit = require("steal-qunit");
var assert = QUnit.assert;
var observe = require("can-observe");
var queues = require("can-queues");
var canReflect = require("can-reflect");
var canSymbol = require("can-symbol");
var Observation = require("can-observation");
var ObservationRecorder = require("can-observation-recorder");

var observableSymbol = canSymbol.for("can.meta");
var computedPropertyDefinitionSymbol = canSymbol.for("can.computedPropertyDefinitions");

QUnit.module("can-observe Objects observability");

QUnit.test("basics with object", function() {
	var person = observe({});
	person.first = "Justin";
	person.last = "Meyer";


	canReflect.onKeyValue(person, "first", function(newVal) {
		QUnit.equal(newVal, "Vyacheslav");
	});

	person.first = "Vyacheslav";
});

QUnit.test("basics with object and property definitions", function() {
	QUnit.expect(6);
	var count = 0;

	var person = observe({});
	person.first = "Christopher";
	person.last = "Baker";

	person[computedPropertyDefinitionSymbol] = Object.create(null);
	person[computedPropertyDefinitionSymbol].fullName = function(instance) {
		return new Observation(function() {
			count++;
			return this.first + " " + this.last;
		}, instance);
	};

	var handler = function(newVal) {
		QUnit.equal(newVal, "Yetti Baker", "handler newVal is correct");
	};

	canReflect.onKeyValue(person, "fullName", handler);
	QUnit.equal(count, 1, "Observation getter was called (onKeyValue)");
	person.first = "Yetti";
	QUnit.equal(count, 2, "Observation getter was called (first changed)");

	canReflect.offKeyValue(person, "fullName", handler);
	person.first = "Bad Wolf";
	QUnit.equal(count, 2, "Observation getter was not called again (first changed, but value not bound)");

	QUnit.equal(person.fullName, "Bad Wolf Baker");
	QUnit.equal(count, 3, "Observation getter was called again (explicit get)");
});

QUnit.test("basics with object and new Observation", function() {
	var person = observe({});
	person.first = "Justin";
	person.last = "Meyer";

	var fullName = new Observation(function() {
		return person.first + " " + person.last;
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


QUnit.test("observables with defaults on the prototype", function() {
	var Type = function() {};
	Type.prototype = {
		age: 35,
		name: "Justin"
	};

	var t = observe(new Type());

	ObservationRecorder.start();
	var age = t.age;
	QUnit.equal(age, 35, "got default value");
	var record = ObservationRecorder.stop();
	QUnit.equal(record.keyDependencies.size, 0, "does not observe on anything");


	var Type2 = function() {
		this.name = "type2";
	};
	Type2.prototype = observe({
		age: 35,
		name: "Justin"
	});

	var t2 = observe(new Type2());

	ObservationRecorder.start();
	var age2 = t2.age;
	QUnit.equal(age2, 35, "got default value");
	var record2 = ObservationRecorder.stop();
	QUnit.equal(record2.keyDependencies.size, 2, "sees two Observation.add");
	QUnit.ok(record2.keyDependencies.has(t2), "observed on the instance");
	QUnit.ok(record2.keyDependencies.has(Type2.prototype), "observed on the prototype");
});


/*
QUnit.test("proxy on prototype gets, sets and deletes correctly and fires parent Observation.add", function(){
	var root = observe({foo:"bar"});
	var obj = Object.create(root);

	QUnit.notOk( obj.hasOwnProperty("foo"), "no foo property on parent" );

	QUnit.equal(obj.foo, "bar", "reads foo");

	obj.prop = "value";
	QUnit.ok(obj.hasOwnProperty("prop"),"set prop on parent");
	QUnit.equal(obj.prop, "value", "reads prop");

	delete obj.prop;
	QUnit.ok(!obj.hasOwnProperty("prop"),"set prop deleted on parent");

	obj.foo = "ZED";
	QUnit.ok( obj.hasOwnProperty("foo"), "foo property on parent" );
	delete obj.foo;
	QUnit.notOk( obj.hasOwnProperty("foo"), "no foo property on parent" );
	QUnit.equal(obj.foo, "bar", "reads foo");
});*/

QUnit.test("isBound", function(){
	var obj = observe({});
	QUnit.notOk( canReflect.isBound(obj), "not bound");
	canReflect.onKeyValue(obj, "foo", function(){});
	QUnit.ok( canReflect.isBound(obj), "bound");
});

QUnit.test("events aren't fired if the value doesn't change", function() {
	var dog = observe({
		name: "Wilbur"
	});

	var events = 0;
	canReflect.onKeyValue(dog, "name", function() {
		events++;
	});

	dog.name = "Fido";
	QUnit.equal(events, 1, "there has been one event");

	dog.name = "Fido";
	QUnit.equal(events, 1, "still just one");

	dog.name = "Wilbur";
	QUnit.equal(events, 2, "now there is two");
});

QUnit.test("Should convert properties if bound #21", function() {
	var nested = {
		nested: 'obj'
	};
	var obj = {
		top: 'obj'
	};
	var obs = observe(obj);
	canReflect.onKeyValue(obs, "nested", function(newVal) {
		QUnit.ok(Object.getOwnPropertySymbols(newVal).indexOf(observableSymbol) > -1, "nested is now observed");
	});

	obs.nested = nested;
});


QUnit.test("Nested objects should be observables #21", function() {
	expect(1);
	var obj = {
		nested: {},
		primitive: 2
	};
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


QUnit.test("Should remove event handlers #21", function() {
	var result = '';
	var obj = {
		nested: {
			prop: ''
		}
	};
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

QUnit.test("getters can be bound within Observations", function() {
	expect(5);
	var count = 0;
	var o = observe({
		get b() {
			QUnit.ok(count <= 4, "hit the getter " + (++count) + " of 4");
			return this.c;
		},
		c: "d"
	});
	var observation = new Observation(function() {
		return o.b;
	});

	var fn;
	canReflect.onValue(observation, fn = function() {
		QUnit.ok(true, "Hit the updater");
	}); // Also reads b's getter, #1

	var d = o.b; // #2
	o.c = "e"; // #3

	// After offKeyValue these shouldn't trigger more updader calls.
	canReflect.offValue(observation, fn);
	d = o.b; // #4
	// This won't trigger b's getter or the updater now.
	o.c = "f";
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

	canReflect.onKeyValue(o, "b", function(newVal) {
		QUnit.equal(newVal, undefined, "Hit the updater for getter/setter");
	}); // Also reads b's getter, #1

	canReflect.onKeyValue(o, "c", function(newVal) {
		QUnit.equal(newVal, undefined, "Hit the updater for value");
	}); // Does not read b's getter so long as getters aren't treated specially.

	delete o.b;
	delete o.c;
});

QUnit.test("patches events for keyed properties on objects", function() {
	expect(9);
	var addObject = observe({});
	var setObject = observe({
		a: 1
	});
	var removeObject = observe({
		a: 1
	});

	addObject[canSymbol.for("can.onPatches")](function(patches) {
		QUnit.equal(patches[0].key, "a", "set a to 1");
		QUnit.equal(patches[0].type, "add");
		QUnit.equal(patches[0].value, 1);
	});
	addObject.a = 1;
	setObject[canSymbol.for("can.onPatches")](function(patches) {
		QUnit.equal(patches[0].key, "a", "set a to 2");
		QUnit.equal(patches[0].type, "set");
		QUnit.equal(patches[0].value, 2);
	});
	setObject.a = 2;
	removeObject[canSymbol.for("can.onPatches")](function(patches) {

		QUnit.equal(patches[0].key, "a", "delete", "delete a");
		QUnit.equal(patches[0].type, "delete", "delete");
		QUnit.ok(!patches[0].value, "delete");
	});
	delete removeObject.a;

});

QUnit.test("can.offPatches unbinds", function(){
	var addObject = observe({});

	addObject[canSymbol.for("can.onPatches")](function(patches) { });

	var handlers = addObject[canSymbol.for("can.meta")].handlers;
	QUnit.equal(handlers.get([]).length, 1, "one handler");
});

require("can-reflect-tests/observables/map-like/instance/on-get-set-delete-key")("", function() {
	return observe({});
});

QUnit.test("adding, removing properites is observable to for-in loops", function(){
	var obj = observe({});
	var keys = new Observation(function getKeys(){
		var keys = [];
		for(var key in obj) {
			keys.push(key);
		}
		return keys;
	});
	var keyChanges = [];

	canReflect.onValue( keys, function gotNewSerialized(newVal){
		keyChanges.push(newVal);
	});
	obj.foo = "bar";
	delete obj.foo;


	QUnit.deepEqual(keyChanges, [["foo"],[]],"got updated");
});
