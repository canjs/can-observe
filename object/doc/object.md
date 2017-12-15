@property {function} can-observe.Object Object
@parent can-observe/properties
@templateRender true

@description Create observable key-value instances or types.

@signature `new observe.Object(properties)`

Create an instance of an observable object.

```js
import observe from "can-observe";

var person = new observe.Object({name: "Frank Castle"});
```

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

var instance = new MyObject({});

canReflect.onPatches( instance, function(patches){ ... });
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

canReflect.onInstancePatches(MyObject, function(instance, patches){ ... });
```

## Use Cases
