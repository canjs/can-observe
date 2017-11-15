
var QUnit =  require("steal-qunit");
var assert = QUnit.assert;
var observe = require("can-observe");
var queues = require("can-queues");
var canReflect = require("can-reflect");
var canSymbol = require("can-symbol");
var Observation = require("can-observation");

var observableSymbol = canSymbol.for("can.meta");

QUnit.module("can-observe with Functions");

QUnit.test("custom, non-array functions return proxied objects as well", function() {
	var p = observe({
		foo: function() {
			return {};
		}
	});

	QUnit.ok(p.foo()[observableSymbol], "Proxied function returns proxy");
});


QUnit.test("basics with constructor functions", 3, function(){
    var OriginalPerson = function(first, last){
        this.first = first;
        this.last = last;
        this.constructor.count++;
    };
    OriginalPerson.prototype.sayHi = function(){
        return this.first + this.last;
    };
    var Person = observe(OriginalPerson);
    QUnit.equal(Person.prototype.constructor, Person, "Person is its own constructor");
    Person.count = 0;



    canReflect.onKeyValue(Person, "count", function(newVal) {
		QUnit.equal(newVal, 1, "static count");
	});

	var person = new Person("Justin","Meyer");


	canReflect.onKeyValue(person, "first", function(newVal) {
		QUnit.equal(newVal, "Vyacheslav", "first changed");
	});

	person.first = "Vyacheslav";
});


require("can-reflect-tests/observables/map-like/type/type")("", function(){
	return observe(function(props){
		canReflect.assign(this, props);
	});
});
