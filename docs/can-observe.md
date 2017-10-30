@module {function} can-observe
@parent can-observables
@collection can-ecosystem
@description Create an observable object.
@package ../package.json

@signature `observe(target)`

Create an observable object that acts as a [proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) for a target object.

```js
var stache = require("can-stache");
var dog = observe({});

var frag = stache("<p>dog's name is {{name}}</p>")(dog);
document.body.appendChild(frag);

dog.name = 'Wilbur'; // -> "<p>dog's name is Wilbur</p>" on the document body
```

@param {Object} target The object from which an observable instance is created.

@return {Proxy} A proxy for the target object.

@body

## Use

Using `can-observe` allows you to create observable objects where any property added is immediately observable, including nested objects. This makes `can-observe` ideal for use-cases where the data may be dynamic, or where the more rigid approach of [can-define] is unneeded.

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

var person = observe({});

var fullName = compute(function(){
	return person.first + " " + person.last;
});

fullName.on("change", function(ev, newVal){
	console.log(newVal); // -> Chasen Le Hara
});


person.first = "Chasen";
person.last = "Le Hara";
```

## Nested Objects

Any Object property in a `can-observe` will be replaced with a `can-observe` observed Proxy on read or write.  This allows deep path traversal in objects, with observable changes all along the way.

```js
var observe = require("can-observe");

var name = { first: "Justin", last: "Meyer" };
var person = { 
	name: name
};

var observed = observe(person); 
observed;       // -> observed is a Proxy;
observed.name;  // -> also a Proxy
person.name;    // -> this is a plain object instead

observed.address = { city: "Chicago" };  // this gets proxified on set, so...
person.address // -> this is a Proxy
```

## ES6 Classes

`can-observe` is specifically designed to work with ES6 classes.  To make view models for your [can-component can-components] from ES6 classes, only a few lines of constructor code are necessary:

```js
import observe from ("can-observe");
import canComponent from ("can-component");
import stache from ("can-stache")

class WidgetViewModel {
	constructor(obj) {
		// view model instances receive properties as an object on instantiation
		Object.assign(this, obj);
		return observe(this);
	}
	get fixedMessage() {
		return "Hello"
	}
	// ... more static and prototype functions.
}

canComponent.extend({
	tag: "my-widget",
	view: stache("<p>{{fixedMessage}}, {{messageFromParent}}</p>"),
	ViewModel: WidgetViewModel
});
```

```html
<my-widget messageFromParent:from="'world'" />

<!-- above tag will contain "<p>Hello, world!</p>" on render --> 
```

## Browser support

can-observe uses the Proxy feature of JavaScript to observe arbitrary properties. Proxies are available in [all modern browsers](http://caniuse.com/#feat=proxy).

A [polyfill is available](https://github.com/GoogleChrome/proxy-polyfill) that brings Proxies back to IE9, with the caveat that only existing properties on the target object can be observed. This means this code:

```js
var person = observe({first: '', last: ''});
```

The *first* and *last* properties are observable in older browsers, but any other property added would not be. To ensure maximum compatibility make sure to give all properties a default value.
