var QUnit = require("steal-qunit");
var ObserveObject = require("./object");
var observeHelpers = require("./helpers");
var Observation = require("can-observation");
var canReflect = require("can-reflect");

var decorators = require("./decorators");
var asyncGetter = decorators.asyncGetter;
var resolver = decorators.resolver;

var classSupport = (function() {
	try {
		eval('"use strict"; class A{};');
		return true;
	} catch (e) {
		return false;
	}

})();

QUnit.module("can-observe/object");

testDecorator("simple getter", function simpleDecorator(target, key, descriptor) {
	observeHelpers.addComputedPropertyDefinition(target, key, function(instance, property) {
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

testDecoratorMethod("asyncGetter", asyncGetter, "fullName", function (resolve) {
	setTimeout(function() {
		resolve(this.first + " " + this.last);
	}.bind(this), 0);
}, function(Person) {
	var person = new Person({ first: "Christopher", last: "Baker" });

	QUnit.equal(person.fullName, undefined, "has correct initial value");

	var didRun = false;
	person.on("fullName", function(){
		if (didRun) {
			QUnit.equal(person.fullName, "Yetti Baker", "has correct value after change");
			QUnit.start();
			return;
		}

		didRun = true;
		QUnit.equal(person.fullName, "Christopher Baker", "has correct value after timeout");
		person.first = "Yetti";
	});

	QUnit.stop();
});

testDecoratorGetter("asyncGetter", asyncGetter, "fullName", function () {
	return new Promise(function(resolve) {
		setTimeout(function() {
			resolve(this.first + " " + this.last);
		}.bind(this), 0);
	}.bind(this));
}, function(Person) {
	var person = new Person({ first: "Christopher", last: "Baker" });

	QUnit.equal(person.fullName, undefined, "has correct initial value");

	var didRun = false;
	person.on("fullName", function(){
		if (didRun) {
			QUnit.equal(person.fullName, "Yetti Baker", "has correct value after change");
			QUnit.start();
			return;
		}

		didRun = true;
		QUnit.equal(person.fullName, "Christopher Baker", "has correct value after timeout");
		person.first = "Yetti";
	});

	QUnit.stop();
});

testDecoratorMethod("resolver", resolver, "count", function (value) {
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



function testDecoratorGetter(decoratorName, decorator, propName, getter, tester) {
	if(classSupport) {
		QUnit.test(decoratorName + " decorator with class Object prototype", function() {
			var ran = false;

			class Type extends ObserveObject {
				get [propName]() {
					ran = true;
					return getter.apply(this, arguments);
				}
			}
			decorator(Type.prototype, propName, Object.getOwnPropertyDescriptor(Type.prototype, propName));

			tester(Type);
			QUnit.equal(ran, true, "getter ran");
		});
	}

	QUnit.test(decoratorName + " decorator with Object.extend prototype", function() {
		var ran = false;

		var Type = ObserveObject.extend("Type", {}, {
			get [propName]() {
				ran = true;
				return getter.apply(this, arguments);
			}
		});
		decorator(Type.prototype, propName, Object.getOwnPropertyDescriptor(Type.prototype, propName));

		tester(Type);
		QUnit.equal(ran, true, "getter ran");
	});
}

function testDecoratorMethod(decoratorName, decorator, propName, method, tester) {
	if(classSupport) {
		QUnit.test(decoratorName + " decorator with class Object prototype", function() {
			var ran = false;

			class Type extends ObserveObject {
				[propName](resolve) {
					ran = true;
					return method.apply(this, arguments);
				}
			}
			decorator(Type.prototype, propName, Object.getOwnPropertyDescriptor(Type.prototype, propName));

			tester(Type);
			QUnit.equal(ran, true, "method ran");
		});
	}

	QUnit.test(decoratorName + " decorator with Object.extend prototype", function() {
		var ran = false;

		var Type = ObserveObject.extend("Type", {}, {
			[propName](resolve) {
				ran = true;
				return method.apply(this, arguments);
			},
		});
		decorator(Type.prototype, propName, Object.getOwnPropertyDescriptor(Type.prototype, propName));

		tester(Type);
		QUnit.equal(ran, true, "method ran");
	});
}

function testDecorator(decoratorName, decorator, propName, method, tester) {
	testDecoratorGetter.apply(null, arguments);
	testDecoratorMethod.apply(null, arguments);
}

module.exports = {
	testDecoratorGetter: testDecoratorGetter,
	testDecoratorMethod: testDecoratorMethod,
	testDecorator: testDecorator,
};
