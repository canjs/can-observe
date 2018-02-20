@property {function} can-observe.Object Object
@parent can-observe/properties
@templateRender true

@description Create observable key-value instances or types.

@signature `new observe.Object(properties)`

Create an instance of an observable object.

```js
import observe from "can-observe";

const person = new observe.Object( { name: "Frank Castle" } );
```

Unlike `observe({name: "Frank Castle"})`, `person` will
have [mixed-in methods and properties](#Mixedinmethodsandproperties) like `.on` and
`.off` available.



@signature `class extends observe.Object {...}`

Extend and create your own `Object` type:

```js
import observe from "can-observe";

class Person extends observe.Object {
	get fullName() {
		return this.first + " " + this.last;
	}
}
```

Getter properties like `fullName` above are computed. Meaning that if they are bound
subsequent reads are not re-evaluated.

Instances of `Person` will
have [mixed-in methods and properties](#Mixedinmethodsandproperties) like `.on` and
`.off` available.

@body

## Mixed in methods and properties

Instances of `observe.Object` have all methods and properties from
[can-event-queue/map/map]:

{{#each (getChildren [can-event-queue/map/map])}}
- [{{name}}] - {{description}}{{/each}}

Example:

```js
class MyObject extends observe.Object {

}

const instance = new MyObject( {} );

canReflect.onPatches( instance, function( patches ) { /* ... */ } );
```


## Mixed-in type methods and properties

Extended `observe.Object` constructor functions have all methods and properties from
[can-event-queue/type/type]:

{{#each (getChildren [can-event-queue/type/type])}}
- [{{name}}] - {{description}}{{/each}}

Example:

```js
class MyObject extends observe.Object {

}

canReflect.onInstancePatches( MyObject, function( instance, patches ) { /* ... */ } );
```

## Use Cases


`observe.Object` is used to make observable __models__ and __view-models__.


## ViewModels

Use `observe.Object` to create __view-models__ for use with [can-component].  The following
creates a `TodoListVM` and and uses it with the `todo-list` component:

```js
class TodoListVM extends observe.Object {
	isEditing( todo ) {
		return todo === this.editing;
	}
	edit( todo ) {
		this.backupName = todo.name;
		this.editing = todo;
	}
	cancelEdit() {
		if ( this.editing ) {
			this.editing.name = this.backupName;
		}
		this.editing = null;
	}
	updateName() {
		this.editing.save();
		this.editing = null;
	}
}

Component.extend( {
	tag: "todo-list",
	view,
	ViewModel: TodoListVM
} );
```

### Special behaviors

`observe.Object` lacks many of the extended features of [can-define]. This means you often need to
add this behavior manually.

When simple `getters` can be used, use [can-component/connectedCallback] to update properties based on other
values. The following keeps `todosList` updated with changes in `todosPromise`:

```js
class AppVM extends observe.Object {
	get todosPromise() {
		if ( !this.filter ) {
			return Todo.getList( {} );
		} else {
			return Todo.getList( {
				complete: this.filter === "complete"
			} );
		}
	}
	connectedCallback() {
		this.listenTo( "todosPromise", ( promise ) => {
			promise.then( ( todos ) => {
				this.todosList = todos;
			} );
		} );
		this.todosPromise.then( ( todos ) => {
			this.todosList = todos;
		} );
		return this.stopListening.bind( this );
	}
}
```

If you'd like a property to be non-enumerable, you need to define this during
initialization of your instance within `constructor`.  The following makes  
`todosList` non-enumerable:

```js
class AppVM extends observe.Object {
	constructor( props ) {
		super( props );
		Object.defineProperty( this, "todosList", {
			enumerable: false,
			value: null,
			configurable: true,
			writable: true
		} );
	}
}
```

## Observable decorators

can-observe ships with two decorators meant to be used when extending can-observe.Object: asyncGetter and resolver.

### @async

The `@async` decorator sets up the value to be connected to the result of an asynchronous call, such as an API request or a promise.

When attached to a method, it passes a `resolve` argument, which you call to set the value. When attached to a getter, it expects the return value to be a promise (specifically, a thenable) or undefined (for no changes);

```javascript
var observe = require("can-observe");

class Thing extends observe.Object {
	@@observe.async
	fullName(resolve) {
		setTimeout(function() {
			resolve(this.first + " " + this.last);
		}.bind(this), 0);
	}

	@@observe.async
	get formalName() {
		return new Promise((resolve) => {
			setTimeout(function() {
				resolve(this.last + ", " + this.first);
			}.bind(this), 0);
		});
	}
}
```

### @resolver

The `@resolver` decorator provides a powerful and generic interface for providing custom functionality without having to deal with the underlying observation. The resolved value is accessed on the instance as a getter.

When attached to a method, it passes an argument with several properties:
* *resolve* - Update the value to be the passed argument (much like the `@asyncGetter` method).
* *listenTo* - Listen for changes to this key on the instance, calling a callback when it changes.
* *stopListening* - Stop listening for changes to this key.
* *lastSet* - The last value that was set.

This example will return a value that counts how many times the `value` property was changed. The resolved value would be accessed as `thing.count` (as a getter).

```javascript
var observe = require("can-observe");

class Thing extends observe.Object {
	@@observe.resolver
	count({ resolve, listenTo }) {
		var count = 0;
		resolve(count);

		listenTo("value", () => {
			resolve(++count);
		});
	}
}
```

## Extending can-observe.Object with rich property behaviors

can-observe.Object recognizes a `can.computedPropertyDefinitions` property. Details of this can be found at [can-observe#Extendingcan-observewithRichPropertyBehaviors].

## Models

Use `observe.Object` to create observable view-models for use
with [can-connect]. The following creates a simple `Todo` type:

```js
import observe from "can-observe";
import baseMap from "can-connect/can/base-map/base-map";

class Todo extends observe.Object {
	updateName( newName ) {
		this.name = newName;
		this.updatedAt = new Date().getTime();
	}
}

baseMap( {
	url: "/api/todos",
	Map: Todo
} );
```
