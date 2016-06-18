import xs, {Stream} from 'xstream';

import fromEvent from 'xstream/extra/fromEvent';

export type Input =
  'down'
  | 'up'
  | 'decrement'
  | 'increment';

function makeKeyboardDriver() {
  return function (): Stream<Input> {
    return xs.merge(
      fromEvent(window, 'keydown')
        .map((e: KeyboardEvent) => {
          switch (e.keyCode) {
            case 74:
              return xs.of('up');
            case 75:
              return xs.of('down');
            default:
              return xs.empty();
          }
        }).flatten(),

      fromEvent(window, 'keyup')
        .map((e: KeyboardEvent) => {
          switch (e.keyCode) {
            case 188:
              return xs.of('decrement');
            case 190:
              return xs.of('increment');
            default:
              return xs.empty();
          }
        }).flatten()
    );
  }
}

export default makeKeyboardDriver;