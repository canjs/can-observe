var QUnit =  require("steal-qunit");
var assert = QUnit.assert;
var compute = require("can-compute");
var observe = require("can-observe");
var stache = require("can-stache");
var canBatch = require("can-event/batch/batch");
var canReflect = require("can-reflect");

QUnit.module("basics");

QUnit.test("basics with object", function(){

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

// nested properties?
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
	var a = {},
    b = {},
    c = {}

	aproxy = observe(a)
	cproxy = observe(c)

	aproxy.b = b;
	cproxy.b = b;

	QUnit.equal(aproxy.b, cproxy.b, "proxied objects should not be duplicated")
});

QUnit.test("Should not duplicate proxies in a cycle #21", function(){
	var a = {};
	var b = {};
	var c = {};
	a.b = b;
	b.c = c;
	c.a = a;

	observe(a);

	QUnit.equal(c.a, a, "proxied objects should not be duplicated")
});

QUnit.test("Nested objects should be observables #21", function(){
	var obj = {nested: {}, primitive: 2};

	canReflect.getKeyValue( obj.nested, "prop", function(newVal){
	    QUnit.equal(newVal, "abc");
	})

	obj.nested.prop = "abc"

	QUnit.equal(false, true, "nested objects should also be observable");
});


QUnit.test("Should convert nested objects to observables in a lazy way", function(){
	var nested = {};
	var obj = {nested: nested};
	var obs = observe(obj);
	QUnit.equal(canReflect.isObservable(nested), false) //-> nested is not converted yet
	QUnit.equal(canReflect.isObservable(nested), true) //-> nested is converted to a proxy and the proxy returned
});

QUnit.test("Should convert properties if bound", function() {
	var nested = {};
	var obj = {};
	var obs = observe(obj);
	canReflect.getKeyValue(obj, "nested", function(newVal){
	    QUnit.equal(canReflect.isObservable(newVal), true) //-> is a proxied nested
	})

	obs.nested = nested;
})
