@property {function} can-observe/sort sort
@parent can-observe/array

@description Add elements to the end of an observe array.
@signature `list.sort([compareFunction])`

  `sort` sorts the elements in place and returns the newly sorted array. The API is the same as the native JavaScript `Array.prototype.sort` API.

  ```js
  import { observe } from "can/everything";

  const names = new observe.Array(['Chris', 'Alice', 'Bob']);
  
  names.sort((a, b) => {
	  if (a.name < b.name) {
		  return -1;
	  } else if (a.name > b.name) {
		  return 1;
	  } else {
		  return 0;
	  }
  });

  console.log(names); //-> ['Alice', 'Bob', 'Chris']
  ```
  @codepen

  @param {function(a, b)} compareFunction Specifies a function that defines the sort order.

  @return {can-observe.Array} The ordered Array

@body

## Events

`sort` causes _length_ events to be fired.
