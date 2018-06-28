@property {function} can-observe.getAsync getAsync
@parent can-observe/decorators

@description Create observable key-value instances or types.

@signature `@observe.getAsync`

The `@getAsync` decorator sets up the value to be connected to the result of an getAsynchronous call, such as an API request or a promise.

When attached to a method, it passes a `resolve` argument, which you call to set the value. When attached to a getter, it expects the return value to be a promise (specifically, a thenable) or undefined (for no changes);

```js
import observe from "can-observe";

class Thing extends observe.Object {
	@@observe.getAsync
	fullName( resolve ) {
		setTimeout( function() {
			resolve( this.first + " " + this.last );
		}.bind( this ), 0 );
	}

	@@observe.getAsync
	get formalName() {
		return new Promise( ( resolve ) => {
			setTimeout( function() {
				resolve( this.last + ", " + this.first );
			}.bind( this ), 0 );
		} );
	}
}
```
