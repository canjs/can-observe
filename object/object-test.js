var ObserveObject = require("./object");
var QUnit = require("steal-qunit");

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

		todo.on("name", function(newVal){
			QUnit.equal(newVal, "Ramiya", "can bound to names");
		});

		QUnit.equal(todo.capsName, "JUSTIN", "getter works");
		//todo.on("capsName", function(newVal){
		//	QUnit.equal(newVal, "RAMIYA", "can bind on computed props")
		//})

		todo.name = "Ramiya";


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

	todo.on("name", function(newVal){
		QUnit.equal(newVal, "Ramiya", "can bound to names");
	});

	QUnit.equal(todo.capsName, "JUSTIN", "getter works");

	todo.name = "Ramiya";

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
