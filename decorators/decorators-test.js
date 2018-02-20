var QUnit = require("steal-qunit");
var Observation = require("can-observation");
var defineProperty = require("../can-observe").defineProperty;

var {
	testDecoratorGetter,
	testDecoratorMethod,
	testDecorator
} = require("./decorators-test-helpers");

var decorators = require("./decorators");

QUnit.module("can-observe/decorators");

testDecorator("simple getter", function simpleDecorator(target, key, descriptor) {
	defineProperty(target, key, function(instance, property) {
		return new Observation(descriptor.value || descriptor.get, instance);
	});
}, "fullName", function () {
	return this.first + " " + this.last;
}, function(Person) {
	var person = new Person({ first: "Christopher", last: "Baker" });

	QUnit.equal(person.fullName, "Christopher Baker", "has correct inital value");

	var didRun = false;
	person.on("fullName", function(){
		didRun = true;

		QUnit.equal(person.fullName, "Yetti Baker", "has correct value after change");
	});

	person.first = "Yetti";
	QUnit.equal(didRun, true, "on(fullName) was run");
});

testDecoratorMethod("async", decorators.async, "fullName", function (resolve) {
	if (!resolve) {
		return "default";
	}

	var value = this.first + " " + this.last;
	setTimeout(function() { resolve(value); }, 100);
}, function(Person) {
	var person = new Person({ first: "Christopher", last: "Baker" });

	QUnit.equal(person.fullName, "default", "has correct initial value");

	var runCount = 0;
	person.on("fullName", function() {
		if (runCount === 0) {
			QUnit.equal(person.fullName, "Christopher Baker", "has correct value after timeout");
			person.first = "Yetti";
		}

		if (runCount === 1) {
			QUnit.equal(person.fullName, "Yetti Baker", "has correct value after change");
			QUnit.start();
		}

		runCount++;
	});

	QUnit.stop();
});

testDecoratorGetter("async", decorators.async, "fullName", function () {
	return new Promise(function(resolve) {
		var value = this.first + " " + this.last;
		setTimeout(function() { resolve(value); }, 100);
	}.bind(this));
}, function(Person) {
	var person = new Person({ first: "Christopher", last: "Baker" });

	QUnit.equal(person.fullName, undefined, "has correct initial value");

	var runCount = 0;
	person.on("fullName", function() {
		if (runCount === 0) {
			QUnit.equal(person.fullName, "Christopher Baker", "has correct value after timeout");
			person.first = "Yetti";
		}

		if (runCount === 1) {
			QUnit.equal(person.fullName, "Yetti Baker", "has correct value after change");
			QUnit.start();
		}

		runCount++;
	});

	QUnit.stop();
});

testDecoratorMethod("resolver", decorators.resolver, "count", function (value) {
	var count = 0;
	value.resolve(count);

	value.listenTo("value", function() {
		value.resolve(++count);
	});
}, function(Type) {
	var person = new Type({ value: "initial" });

	var count = 0;
	var didRun = false;
	person.on("count", function() {
		didRun = true;

		QUnit.equal(person.count, count, "has correct value after change " + count);
	});

	QUnit.equal(person.count, 0, "has correct initial value");

	count++;
	person.value = "changed";
	count++;
	person.value = "again";

	QUnit.equal(didRun, true, "on(count) was run");
});
