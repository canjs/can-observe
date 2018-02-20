var ObserveObject = require("./object");
var QUnit = require("steal-qunit");
var ObservationRecorder = require("can-observation-recorder");
var Observation = require("can-observation");
var canReflect = require("can-reflect");

var defineProperty = require("../can-observe").defineProperty;

QUnit.module("can-observe/object");

var classSupport = (function() {
	try {
		eval('"use strict"; class A{};');
		return true;
	} catch (e) {
		return false;
	}

})();

if(classSupport) {
    QUnit.test("class Object basics", function(){
        class Todo extends ObserveObject {
            constructor(props){
                super(props);
                this.complete = false;
            }
            get capsName(){
                return this.name.toUpperCase();
            }
        }
        var todo = new Todo({name: "Justin"});

        QUnit.equal(todo.complete, false, "default complete");

		todo.on("name", function(ev, newVal){
			QUnit.equal(newVal, "Ramiya", "can bound to names");
		});

		QUnit.equal(todo.capsName, "JUSTIN", "getter works");
		//todo.on("capsName", function(newVal){
		//	QUnit.equal(newVal, "RAMIYA", "can bind on computed props")
		//})

		todo.name = "Ramiya";


    });

	QUnit.test("computed getters getKeyDependencies", function(assert) {
		class Person extends ObserveObject {
			get fullName() {
				return this.first + " " + this.last;
			}
		}

		var me = new Person();
		me.first = "John";
		me.last = "Doe";

		assert.ok(
			canReflect.getKeyDependencies(me, "fullName").valueDependencies,
			"should return the internal observation"
		);
	});

	require("can-reflect-tests/observables/map-like/type/type")("class Type extends observe.Object", function() {
		return class Type extends ObserveObject {};
	});

	var Type;
	require("can-reflect-tests/observables/map-like/instance/on-get-set-delete-key")("class Type extends observe.Object", function() {
		if(!Type) {
			Type = class Type extends ObserveObject {};
		}
		return new Type({});
	});
}

QUnit.test("Object.extend basics", function(){
	var Todo = ObserveObject.extend("Todo",{},{
		init: function(){
			this.complete = false;
		},
		get capsName(){
			return this.name.toUpperCase();
		}
	});
	var todo = new Todo({name: "Justin"});

	QUnit.equal(todo.complete, false, "default complete");

	todo.on("name", function(ev, newVal){
		QUnit.equal(newVal, "Ramiya", "can bound to names");
	});

	QUnit.equal(todo.capsName, "JUSTIN", "getter works");

	todo.name = "Ramiya";

});

if(classSupport) {
	QUnit.test("class Object basics, with property definitions on prototype", function() {
		function observeDecorator(target, key, descriptor) {
			defineProperty(target, key, function(instance, property) {
				return new Observation(descriptor.value || descriptor.get, instance);
			});
		}

		let fullNameCount = 0;
		let formalNameCount = 0;

		var fullNameHandler = function(newVal) {
			QUnit.equal(newVal, "Yetti Baker", "handler newVal is correct");
		};
		var formalNameHandler = function(newVal) {
			QUnit.equal(newVal, "Baker, Yetti", "handler newVal is correct");
		};

		class Person extends ObserveObject {
			fullName() {
				fullNameCount++;
				return this.first + " " + this.last;
			}
			get formalName() {
				formalNameCount++;
				return this.last + ", " + this.first;
			}
		}
		observeDecorator(Person.prototype, "fullName", Object.getOwnPropertyDescriptor(Person.prototype, "fullName"));
		observeDecorator(Person.prototype, "formalName", Object.getOwnPropertyDescriptor(Person.prototype, "formalName"));

		QUnit.equal(fullNameCount, 0, "fullName has run 0 times");
		QUnit.equal(formalNameCount, 0, "formalName has run 0 times");

		var person = new Person({ first: "Christopher", last: "Baker" });

		canReflect.onKeyValue(person, "fullName", fullNameHandler);
		QUnit.equal(fullNameCount, 1, "fullName observation getter was called (onKeyValue)");
		QUnit.equal(person.fullName, "Christopher Baker", "person.fullName has correct value");
		QUnit.equal(person.fullName, "Christopher Baker", "person.fullName has correct value, again");
		QUnit.equal(fullNameCount, 1, "fullName observation getter was not called again");

		canReflect.onKeyValue(person, "formalName", formalNameHandler);
		QUnit.equal(formalNameCount, 1, "formalName observation getter was called (onKeyValue)");
		QUnit.equal(person.formalName, "Baker, Christopher", "person.formalName has correct value");
		QUnit.equal(person.formalName, "Baker, Christopher", "person.formalName has correct value, again");
		QUnit.equal(formalNameCount, 1, "formalName observation getter was not called again");

		var onFullName = false;
		person.on("fullName", function(){
			onFullName = true;

			QUnit.equal(formalNameCount, 2, "formalName observation getter was run again (first changed)");
			QUnit.equal(person.formalName, "Baker, Yetti", "person.formalName has correct value");
			QUnit.equal(person.formalName, "Baker, Yetti", "person.formalName has correct value, again");
			QUnit.equal(formalNameCount, 2, "formalName observation getter was run again (first changed)");
		});

		var onFormalName = false;
		person.on("formalName", function(){
			onFormalName = true;

			QUnit.equal(formalNameCount, 2, "formalName observation getter was run again (first changed)");
			QUnit.equal(person.formalName, "Baker, Yetti", "person.formalName has correct value");
			QUnit.equal(person.formalName, "Baker, Yetti", "person.formalName has correct value, again");
			QUnit.equal(formalNameCount, 2, "formalName observation getter was run again (first changed)");
		});

		person.first = "Yetti";
		QUnit.equal(onFullName, true, "person.on(fullName) was run");
		QUnit.equal(onFormalName, true, "person.on(formalName) was run");
	});

	QUnit.test("class Object basics, with property definitions on extended prototype", function() {
		function observeDecorator(target, key, descriptor) {
			defineProperty(target, key, function(instance, property) {
				return new Observation(descriptor.value || descriptor.get, instance);
			});
		}

		let fullNameCount = 0;
		let formalNameCount = 0;

		var fullNameHandler = function(newVal) {
			QUnit.equal(newVal, "Kal-el Kent", "handler newVal is correct");
		};
		var formalNameHandler = function(newVal) {
			QUnit.equal(newVal, "Kent, Kal-el", "handler newVal is correct");
		};

		class Person extends ObserveObject {
			fullName() {
				fullNameCount++;
				return this.first + " " + this.last;
			}
		}
		observeDecorator(Person.prototype, "fullName", Object.getOwnPropertyDescriptor(Person.prototype, "fullName"));

		class Superhero extends Person {
			get formalName() {
				formalNameCount++;
				return this.last + ", " + this.first;
			}
		}
		observeDecorator(Superhero.prototype, "formalName", Object.getOwnPropertyDescriptor(Superhero.prototype, "formalName"));

		QUnit.equal(fullNameCount, 0, "fullName has run 0 times");
		QUnit.equal(formalNameCount, 0, "formalName has run 0 times");

		var superhero = new Superhero({ first: "Clark", last: "Kent" });

		canReflect.onKeyValue(superhero, "fullName", fullNameHandler);
		QUnit.equal(fullNameCount, 1, "fullName observation getter was called (onKeyValue)");
		QUnit.equal(superhero.fullName, "Clark Kent", "superhero.fullName has correct value");
		QUnit.equal(superhero.fullName, "Clark Kent", "superhero.fullName has correct value, again");
		QUnit.equal(fullNameCount, 1, "fullName observation getter was not called again");

		canReflect.onKeyValue(superhero, "formalName", formalNameHandler);
		QUnit.equal(formalNameCount, 1, "formalName observation getter was called (onKeyValue)");
		QUnit.equal(superhero.formalName, "Kent, Clark", "superhero.formalName has correct value");
		QUnit.equal(superhero.formalName, "Kent, Clark", "superhero.formalName has correct value, again");
		QUnit.equal(formalNameCount, 1, "formalName observation getter was not called again");

		var onFullName = false;
		superhero.on("fullName", function(){
			onFullName = true;

			QUnit.equal(fullNameCount, 2, "fullName observation getter was run again (first changed)");
			QUnit.equal(superhero.fullName, "Kal-el Kent", "superhero.fullName has correct value");
			QUnit.equal(superhero.fullName, "Kal-el Kent", "superhero.fullName has correct value, again");
			QUnit.equal(fullNameCount, 2, "fullName observation getter was run again (first changed)");
		});

		var onFormalName = false;
		superhero.on("formalName", function(){
			onFormalName = true;

			QUnit.equal(formalNameCount, 2, "formalName observation getter was run again (first changed)");
			QUnit.equal(superhero.formalName, "Kent, Kal-el", "superhero.formalName has correct value");
			QUnit.equal(superhero.formalName, "Kent, Kal-el", "superhero.formalName has correct value, again");
			QUnit.equal(formalNameCount, 2, "formalName observation getter was run again (first changed)");
		});

		superhero.first = "Kal-el";
		QUnit.equal(onFullName, true, "superhero.on(fullName) was run");
		QUnit.equal(onFormalName, true, "superhero.on(formalName) was run");
	});
}

QUnit.test("Object.extend basics, with property definitions on prototype", function() {
	function observeDecorator(target, key, descriptor) {
		defineProperty(target, key, function(instance, property) {
			return new Observation(descriptor.value || descriptor.get, instance);
		});
	}

	let fullNameCount = 0;
	let formalNameCount = 0;

	var fullNameHandler = function(newVal) {
		QUnit.equal(newVal, "Yetti Baker", "handler newVal is correct");
	};
	var formalNameHandler = function(newVal) {
		QUnit.equal(newVal, "Baker, Yetti", "handler newVal is correct");
	};

	var Person = ObserveObject.extend("Person", {}, {
		fullName() {
			fullNameCount++;
			return this.first + " " + this.last;
		},
		get formalName() {
			formalNameCount++;
			return this.last + ", " + this.first;
		}
	});
	observeDecorator(Person.prototype, "fullName", Object.getOwnPropertyDescriptor(Person.prototype, "fullName"));
	observeDecorator(Person.prototype, "formalName", Object.getOwnPropertyDescriptor(Person.prototype, "formalName"));

	QUnit.equal(fullNameCount, 0, "fullName has run 0 times");
	QUnit.equal(formalNameCount, 0, "formalName has run 0 times");

	var person = new Person({ first: "Christopher", last: "Baker" });

	canReflect.onKeyValue(person, "fullName", fullNameHandler);
	QUnit.equal(fullNameCount, 1, "fullName observation getter was called (onKeyValue)");
	QUnit.equal(person.fullName, "Christopher Baker", "person.fullName has correct value");
	QUnit.equal(person.fullName, "Christopher Baker", "person.fullName has correct value, again");
	QUnit.equal(fullNameCount, 1, "fullName observation getter was not called again");

	canReflect.onKeyValue(person, "formalName", formalNameHandler);
	QUnit.equal(formalNameCount, 1, "formalName observation getter was called (onKeyValue)");
	QUnit.equal(person.formalName, "Baker, Christopher", "person.formalName has correct value");
	QUnit.equal(person.formalName, "Baker, Christopher", "person.formalName has correct value, again");
	QUnit.equal(formalNameCount, 1, "formalName observation getter was not called again");

	var onFullName = false;
	person.on("fullName", function(){
		onFullName = true;

		QUnit.equal(formalNameCount, 2, "formalName observation getter was run again (first changed)");
		QUnit.equal(person.formalName, "Baker, Yetti", "person.formalName has correct value");
		QUnit.equal(person.formalName, "Baker, Yetti", "person.formalName has correct value, again");
		QUnit.equal(formalNameCount, 2, "formalName observation getter was run again (first changed)");
	});

	var onFormalName = false;
	person.on("formalName", function(){
		onFormalName = true;

		QUnit.equal(formalNameCount, 2, "formalName observation getter was run again (first changed)");
		QUnit.equal(person.formalName, "Baker, Yetti", "person.formalName has correct value");
		QUnit.equal(person.formalName, "Baker, Yetti", "person.formalName has correct value, again");
		QUnit.equal(formalNameCount, 2, "formalName observation getter was run again (first changed)");
	});

	person.first = "Yetti";
	QUnit.equal(onFullName, true, "person.on(fullName) was run");
	QUnit.equal(onFormalName, true, "person.on(formalName) was run");
});

QUnit.test("Object.extend basics, with property definitions on extended prototype", function() {
	function observeDecorator(target, key, descriptor) {
		defineProperty(target, key, function(instance, property) {
			return new Observation(descriptor.value || descriptor.get, instance);
		});
	}

	let fullNameCount = 0;
	let formalNameCount = 0;

	var fullNameHandler = function(newVal) {
		QUnit.equal(newVal, "Kal-el Kent", "handler newVal is correct");
	};
	var formalNameHandler = function(newVal) {
		QUnit.equal(newVal, "Kent, Kal-el", "handler newVal is correct");
	};

	var Person = ObserveObject.extend("Person", {}, {
		fullName() {
			fullNameCount++;
			return this.first + " " + this.last;
		},
	});
	observeDecorator(Person.prototype, "fullName", Object.getOwnPropertyDescriptor(Person.prototype, "fullName"));

	var Superhero = Person.extend("Superhero", {}, {
		get formalName() {
			formalNameCount++;
			return this.last + ", " + this.first;
		}
	});
	observeDecorator(Superhero.prototype, "formalName", Object.getOwnPropertyDescriptor(Superhero.prototype, "formalName"));

	QUnit.equal(fullNameCount, 0, "fullName has run 0 times");
	QUnit.equal(formalNameCount, 0, "formalName has run 0 times");

	var superhero = new Superhero({ first: "Clark", last: "Kent" });

	canReflect.onKeyValue(superhero, "fullName", fullNameHandler);
	QUnit.equal(fullNameCount, 1, "fullName observation getter was called (onKeyValue)");
	QUnit.equal(superhero.fullName, "Clark Kent", "superhero.fullName has correct value");
	QUnit.equal(superhero.fullName, "Clark Kent", "superhero.fullName has correct value, again");
	QUnit.equal(fullNameCount, 1, "fullName observation getter was not called again");

	canReflect.onKeyValue(superhero, "formalName", formalNameHandler);
	QUnit.equal(formalNameCount, 1, "formalName observation getter was called (onKeyValue)");
	QUnit.equal(superhero.formalName, "Kent, Clark", "superhero.formalName has correct value");
	QUnit.equal(superhero.formalName, "Kent, Clark", "superhero.formalName has correct value, again");
	QUnit.equal(formalNameCount, 1, "formalName observation getter was not called again");

	var onFullName = false;
	superhero.on("fullName", function(){
		onFullName = true;

		QUnit.equal(fullNameCount, 2, "fullName observation getter was run again (first changed)");
		QUnit.equal(superhero.fullName, "Kal-el Kent", "superhero.fullName has correct value");
		QUnit.equal(superhero.fullName, "Kal-el Kent", "superhero.fullName has correct value, again");
		QUnit.equal(fullNameCount, 2, "fullName observation getter was run again (first changed)");
	});

	var onFormalName = false;
	superhero.on("formalName", function(){
		onFormalName = true;

		QUnit.equal(formalNameCount, 2, "formalName observation getter was run again (first changed)");
		QUnit.equal(superhero.formalName, "Kent, Kal-el", "superhero.formalName has correct value");
		QUnit.equal(superhero.formalName, "Kent, Kal-el", "superhero.formalName has correct value, again");
		QUnit.equal(formalNameCount, 2, "formalName observation getter was run again (first changed)");
	});

	superhero.first = "Kal-el";
	QUnit.equal(onFullName, true, "superhero.on(fullName) was run");
	QUnit.equal(onFormalName, true, "superhero.on(formalName) was run");
});

QUnit.test("default values are observable", 3, function(){
	var Type = ObserveObject.extend("Type",{},{
		someValue: 3
	});

	var instance = new Type({});

	ObservationRecorder.start();
	var val = instance.someValue;
	var record = ObservationRecorder.stop();
	QUnit.equal(val, 3, "got someValue");
	QUnit.ok( record.keyDependencies.get(instance).has("someValue"), "bound to someValue" );

	instance.on("someValue", function(ev, newVal){
		QUnit.equal(newVal, 4, "got newVal");
	});
	instance.someValue = 4;
});

QUnit.test("Don't observe functions", function(){
	var Type = ObserveObject.extend("Type",{},{
		someValue: 3,
		method: function(){
			return this.someValue;
		}
	});

	var instance = new Type({});

	ObservationRecorder.start();
	var val = instance.method();
	var record = ObservationRecorder.stop();
	QUnit.equal(val, 3, "got someValue");
	QUnit.ok( record.keyDependencies.get(instance).has("someValue"), "bound to someValue" );
});

require("can-reflect-tests/observables/map-like/type/type")("observe.Object.extend", function() {
	return ObserveObject.extend("Todo",{},{});
});

var ExtendType;
require("can-reflect-tests/observables/map-like/instance/on-get-set-delete-key")("observe.Object.extend", function() {
	if(!ExtendType) {
		ExtendType = ObserveObject.extend("Todo",{},{});
	}
	return new ExtendType({});
});

QUnit.test("getters work", function(){
	var actions = [];
	var Person = ObserveObject.extend("Person",{},{
		get fullName() {
			var res = this.first + " " + this.last;
			actions.push("fullName");
			return res;
		}
	});

	var person = new Person({
		first: "Justin",
		last: "Meyer"
	});

	person.on("fullName", function fullNameCallback(ev, newName){
		actions.push("fullNameCallback "+newName);
	});
	actions.push("on('fullName')");

	QUnit.equal(person.fullName,"Justin Meyer", "full name is right");

	person.first = "Ramiya";

	QUnit.deepEqual(actions,[
		"fullName",
		"on('fullName')",
		"fullName",
		"fullNameCallback Ramiya Meyer"
	],"behavior is right");

});
