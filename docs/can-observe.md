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
