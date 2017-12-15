@property {function} can-observe.Array Array
@parent can-observe/properties
@templateRender true

@description Create observable Array instances or types.

@signature `new observe.Array([items])`

Create an instance of an observable array.

```js
import observe from "can-observe";

var hobbies = new observe.Array(["JS","Reading"]);
```

@signature `class extends observe.Array {...}`

Extend and create your own `Array` type:

```js
import observe from "can-observe";

class TodoList extends observe.Array {
    get active() {
        return this.filter(function(todo) {
            return todo.complete === false;
        });
    }
}
```

Getter properties like `active` above are computed. Meaning that if they are bound
subsequent reads are not re-evaluated.



@body

## Mixed in methods and properties

Instances of `observe.Array` have all methods and properties from
[can-event-queue/map/map]:

{{#each (getChildren [can-event-queue/map/map])}}
- [{{name}}] - {{description}}{{/each}}

Example:

```js
class MyArray extends observe.Array {

}

var arrayInstance = new MyArray([]);

canReflect.onPatches( arrayInstance, function(patches){ ... });
```


## Mixed-in type methods and properties

Extended `observe.Array` constructor functions have all methods and properties from
[can-event-queue/type/type]:

{{#each (getChildren [can-event-queue/type/type])}}
- [{{name}}] - {{description}}{{/each}}

Example:

```js
class MyArray extends observe.Array {

}

canReflect.onInstancePatches(MyArray, function(instance, patches){ ... });
```

## Use Cases

`observe.Array`
