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

	fullName.bind("change", function(ev, newVal, oldVal){
		QUnit.start();
		QUnit.equal(newVal, "Vyacheslav Egorov");
		QUnit.equal(oldVal, "Justin Meyer");
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


	hobbiesList.bind("change", function(ev, newVal, oldVal){
		QUnit.equal(newVal, "basketball");
		QUnit.equal(oldVal, "basketball,programming");
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
	dog.addEventListener("name", function(){
		events++;
	});

	dog.name = "Fido";
	QUnit.equal(events, 1, "there has been one event");

	dog.name = "Fido";
	QUnit.equal(events, 1, "still just one");

	dog.name = "Wilbur";
	QUnit.equal(events, 2, "now there is two");
});

QUnit.module("without proxies #19");

QUnit.test("Object should be mutated when true flag is passed", function(){
	var dogObj = {name: "Wilbur", tail: true};
	var dog = observe(dogObj, true);

	QUnit.equal(dog, dogObj, "the object should be decorated and not use a proxy")

});

QUnit.test("Change event should trigger when properties change on an object", function(){
	var personObj = {first: "Justin", last: "Meyer"}

	var person = observe(personObj, true);
	QUnit.equal(personObj, person, "the object should be decorated and not use a proxy");

	var fullName = compute(function(){
		return person.first +" "+ person.last;
	});

	QUnit.stop();
	canReflect.onKeyValue(fullName, "change", function(event, newVal, oldVal){
		QUnit.start();
		QUnit.equal(newVal, "Vyacheslav Egorov");
		QUnit.equal(oldVal, "Justin Meyer");
	});
	// causes change event above
	canBatch.start();
	person.first = "Vyacheslav";
	person.last = "Egorov";
	canBatch.stop();
});

QUnit.test("Change event should trigger when properties change on an array", function(){
	var hobbiesArr = ["basketball","programming"];
	var hobbies = observe(hobbiesArr, true);

	QUnit.equal(hobbiesArr, hobbies, "the array should be decorated and not use a proxy");

	var hobbiesList = compute(function(){
	    return hobbies.join(",");
	});

	canReflect.onKeyValue(hobbiesList, "change", function(event, newValue, oldValue){
		QUnit.equal(newVal, "basketball");
		QUnit.equal(oldVal, "basketball,programming");
	})

	// causes change event above
	hobbies.pop();
});

QUnit.test("Should call handers when an array mutation occurs", function() {
	expect(2)
	var arr = [1,2,3];
	observe(arr, true);
	canReflect.onValue(arr, function(newVal, oldVal) {
		assert.ok( newVal === 4, "push calls the first handler" );
	})

	canReflect.onValue(arr, function(newVal, oldVal) {
		assert.ok( newVal === 4, "push calls the second handler" );
	})

	arr.push(4)
});

QUnit.test("Methods that mutate the array should trigger a compute", function() {
	expect(2)
	var arr = [1,2,3];
	observe(arr, true);

	var arrList = compute(function() {
		assert.ok(true, "compute should be fired twice");
	    return arr.join(",");
	});

	canReflect.onKeyValue(arrList, "change", function(event, newValue, oldValue) {
		console.log(newValue);
	});

	//push should trigger the compute
	arr.push(4);
});

QUnit.test("Reading the array should trigger a compute", function() {
	expect(2);
	var arr = [1,2,3];
	observe(arr, true);

	var arrList = compute(function() {
		assert.ok(true, "compute should be triggered twice");
		return arr.join(",");
	});

	canReflect.onKeyValue(arrList, "change", function(event, newValue, oldValue) {
		QUnit.equal(newValue, "1,2,3", "the compute should be triggered when the array is read");
	})

	//forEach should trigger the compute
	arr.forEach(function(item){
	});
});

QUnit.skip("Should work with plain nested objects", function(){
	var oldPOJO = {hello: "world"};
	var newPOJO = {hello: "goodbye"};
	var personObj = {first: "Justin", last: "Meyer", nested: oldPOJO};

	var person = observe(personObj, true);
	QUnit.equal(personObj, person, "the object should be decorated and not use a proxy");

	QUnit.stop();

	canReflect.onKeyValue(person.nested, "hello", function(ev, newVal, oldVal){
		QUnit.start();
		QUnit.equal(newVal, "goodbye");
		QUnit.equal(oldVal, "world");
	});
	// causes change event above
	canBatch.start();
	person.nested = newPOJO;
	canBatch.stop();
});
QUnit.skip("Warning occurs when adding properties after a non-proxy observable is decorated", function(){
	// We have two options to deal with this situation:

	// Object.seal() these objects so users get warnings when adding new properties that were not already defined. Users will need to define their properties, or use the proxy version. Or,
	// Tell users to use canReflect.get(obj, "last") if the property might not be already defined.
	var person = observe({hi: 'hello'}, true);

	var oldWarn = console.warn;

	console.warn = function(msg) {
		QUnit.equal(msg, "This object is sealed. Use canReflect.get() instead."); //or something like this
	};

	person.first = 'Dolly';
});
