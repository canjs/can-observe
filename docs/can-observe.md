@module {function} can-observe
@parent can-ecosystem
@description Create an observable object.

@signature `observe(target)`

Create an observable object that acts as a [proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) for a target object.

```js
var dog = observe({});

dog.addEventListener('name', function(){
	// Name changed!
});

dog.name = 'Wilbur';
```

@param {Object} target The object from which an observable instance is created.

@return {Proxy} A proxy for the target object.

@body

## Use

Using __can-observe__ allows you to create observable objects for which any property added can be observed. It is like [can-map] but without the required [can-map.prototype.attr attr] method. This makes can-observe ideal for use-cases where the data that needs to be observed might be dynamic, or where the more rigid approach of [can-define] is unneeded.

To use can-observe call the observe method with an object for which to create a proxy for. This will return a [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) object for which any changes will then reflect back on the target object.

```js
var dog = observe({});

dog.on("name", function(){
	// changed!
});

dog.name = "Wilbur";
```

can-observe can be combined with any other CanJS observable type, like [can-define] or [can-compute]. In this example we create a compute that changes when a can-observe proxy changes.

```js
var compute = require("can-compute");
var observe = require("can-observe");

var person = observe({})

var fullName = compute(function(){
	return person.first + " " + person.last;
});

fullName.on("change", function(){
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
