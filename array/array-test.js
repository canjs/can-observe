var ObserveArray = require("./array");
var ObserveObject = require("../object/object");
var QUnit = require("steal-qunit");
var metaSymbol = require("can-symbol").for("can.meta");
QUnit.module("can-observe/array");

var classSupport = (function() {
	try {
		eval('"use strict"; class A{};');
		return true;
	} catch (e) {
		return false;
	}

})();

if(classSupport) {
    QUnit.test("observe.Array basics", function(){
        class TodoList extends ObserveArray {
        }
        var todos = new TodoList(["a","b","c"]);

        QUnit.equal(todos.length, 3, "3 items");



		todos.on("length", function(newVal){
			QUnit.equal(newVal, 4, "length is 4");
		});

		todos.push("4");

    });

    require("can-reflect-tests/observables/list-like/type/on-instance-patches")("observe.Array", function() {
    	return class MyArray extends ObserveArray {};
    });

    var MyArray, MyType;
    require("can-reflect-tests/observables/list-like/instance/serialize")("observe.Array observe.Object", function(values){
    	if(!MyArray) {
    		MyArray = class MyArray extends ObserveArray {};
    	}
    	return new MyArray(values);
    }, function(values){
    	if(!MyType) {
    		MyType = class MyType extends ObserveObject {};
    	}
    	return new MyType(values);
    });

}

QUnit.test("observe.Array.extend basics", function(){
    var TodoList = ObserveArray.extend("TodoList",{},{});

    var todos = new TodoList(["a","b","c"]);

    QUnit.equal(todos.length, 3, "3 items");



    todos.on("length", function(newVal){
        QUnit.equal(newVal, 4, "length is 4");
    });

    todos.push("4");

});

QUnit.test("connected and disconnected callbacks", function(){
	var List = ObserveArray.extend("List",{},{
		connectedCallback: function(){
			this.listenTo(this[0],"name", function(newName){
				QUnit.equal(newName, "Ramiya", "name updated");
			});
		}
	});

	var instance = new List([{name: "Justin"}]);
	var first = instance[0];

	instance.connectedCallback();

	var handlers = first[metaSymbol].handlers;
	QUnit.equal(handlers.get(["name"]).length, 1, "has one handler");

	instance.disconnectedCallback();

	QUnit.equal(handlers.get(["name"]).length, 0, "has no handlers");
});

require("can-reflect-tests/observables/list-like/type/on-instance-patches")("observe.Array.extend", function() {
    return ObserveArray.extend("TodoList",{},{});
});

var MyExtendArray, MyExtendedType;
require("can-reflect-tests/observables/list-like/instance/serialize")("observe.Array.extend observe.Object.extend", function(values){
    if(!MyExtendArray) {
        MyExtendArray = ObserveArray.extend("MyExtendArray",{},{});
    }
    return new MyExtendArray(values);
}, function(values){
    if(!MyExtendedType) {
        MyExtendedType = ObserveObject.extend("MyExtendedType",{},{});
    }
    return new MyExtendedType(values);
});
