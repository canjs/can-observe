var ObserveObject = require("./object");
var QUnit = require("steal-qunit");
var ObservationRecorder = require("can-observation-recorder");
var canReflect = require("can-reflect");

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

	QUnit.test("decorator basics", function(){
		class Todo extends ObserveObject {
			constructor(props){
                super(props);
                this.complete = false;
            }
		}
		function observationDecorator(target, key, descriptor){

			{
				get: function(){
					// lazily create observation and read it
				},
				set: function(){
					// lazily create observation and set it
				}
			}

			return {
				value: function() {
					return new Observation(descriptor.get, this);
				}
			}
		}
	})

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

		debugger;
		todo.capsName

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
