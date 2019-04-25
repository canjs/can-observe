@property {function} can-observe/push push
@parent can-observe/array

@description Add elements to the end of an observe array.
@signature `list.push(...elements)`

  `push` adds elements onto the end of an observe array.

  ```js
  import { observe } from "can/everything";

  const names = new observe.Array(['Alice', 'Bob']);
  names.push('Chris');

  console.log(names); //-> ['Alice', 'Bob', 'Chris']
  ```
  @codepen

  @param {*} elements the elements to add to the Array

  @return {Number} the new length of the Array

@body

## Use

If you wish to listen to changes on the array:

```js
import { observe, Reflect } from "can/everything";

const birds = ['Buzzard', 'Sparrowhawk'];
const list = observe(['Eagle']);

Reflect.onPatches(list, function (data) {
	console.log(data[0].insert) //-> ['Buzzard', 'Sparrowhawk']
})

list.push(...birds);
console.log(list); // ['Buzzard', 'Sparrowhawk', 'Eagle']
```
@codepen

## Events

`push` causes _length_ events to be fired.
