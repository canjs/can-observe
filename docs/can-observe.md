@module {function} can-observe
@parent can-ecosystem
@description Create an observable object.
@package ../package.json

@signature `observe(target)`

Create an observable object that acts as a [proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) for a target object.

```js
var canReflect = require("can-reflect");
var dog = observe({});

canReflect.onKeyValue(dog, 'name', function(newVal){
	// Name changed!
});

dog.name = 'Wilbur';
```

@param {Object} target The object from which an observable instance is created.

@return {Proxy} A proxy for the target object.

@body

## Use

Using `can-observe` allows you to create observable objects with any property added can be observed, including nested objects. It is like [can-map] but without the required [can-map.prototype.attr attr] method. This makes `can-observe` ideal for use-cases where the data may be dynamic, or where the more rigid approach of [can-define] is unneeded.

To use `can-observe` call the `observe()` method with an object. This will return a [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) object where any changes will reflect back on the target object. Nested objects will be observed lazily when they are accessed or set dynamically after initialization on a `can-observe` proxy object.

To listen for changes on a property, use [can-reflect/observe.onKeyValue canReflect.onKeyValue]. Pass the handler as the third argument which will be triggered when a new value is set on the proxy. In the example below, updating `dog.name` to `"Wilbur"` will trigger the callback that will `console.log` the new value `"Wilbur"`.

```js
var canReflect = require("can-reflect");
var dog = observe({});

canReflect.onKeyValue(dog, 'name', function(newVal){
	console.log(newVal); //-> "Wilbur"
});

dog.name = "Wilbur";
```

`can-observe` can be combined with any other CanJS observable type, like [can-define] or [can-compute]. In this example we create a compute that changes when a can-observe proxy changes. Note that with computes we use [can-reflect/observe.onValue canReflect.onValue] to set up the event listener and handler.

```js
var compute = require("can-compute");
var observe = require("can-observe");
var canReflect = require("can-reflect");

var person = observe({})

var fullName = compute(function(){
	return person.first + " " + person.last;
});

canReflect.onValue(fullName, "change", function(){
	console.log(fullName()); // -> Chasen Le Hara
});


person.first = "Chasen";
person.last = "Le Hara";
```

## Browser support

can-observe uses the Proxy feature of JavaScript to observe arbitrary properties. Proxies are available in [all modern browsers](http://caniuse.com/#feat=proxy).

A [polyfill is available](https://github.com/GoogleChrome/proxy-polyfill) that brings Proxies back to IE9, with the caveat that only existing properties on the target object can be observed. This means this code:

```js
var person = observe({first: '', last: ''});
```

The *first* and *last* properties are observable in older browsers, but any other property added would not be. To ensure maximum compatibility make sure to give all properties a default value.
