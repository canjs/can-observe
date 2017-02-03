# can-observe

Create plain observable objects. These objects can be observed by computes, or other map types like can-define.

## Example

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

- <code>[__can-observe__ function](#can-observe-function)</code>
  - <code>[observe(target)](#observetarget)</code>

## API


## <code>__can-observe__ function</code>
Create an observable object.


### <code>observe(target)</code>


Create an observable object that acts as a [proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) for a target object.

```js
var dog = observe({});

dog.addEventListener('name', function(){
	// Name changed!
});

dog.name = 'Wilbur';
```


1. __target__ <code>{Object}</code>:
  The object from which an observable instance is created.


- __returns__ <code>{Proxy}</code>:
  A proxy for the target object.
