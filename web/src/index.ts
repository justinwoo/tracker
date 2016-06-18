import xs, {Stream} from 'xstream';
import dropRepeats from 'xstream/extra/dropRepeats';
import debounce from 'xstream/extra/debounce';
import {run} from '@cycle/xstream-run';
import {makeDOMDriver} from '@cycle/dom';

import makeKeyboardDriver, {Input} from './drivers/keyboard';
import makeScrollIntoViewDriver from './drivers/scroll-into-view';
import makeSendUpdateDriver, {Update} from './drivers/send-update';

import intent from './intent';
import model, {Model} from './model';
import view from './view';

function main({DOM, keyboard}) {
  let actions = intent(DOM);
  let state$ = model(actions, keyboard);
  let vtree$ = view(state$);
  return {
    DOM: vtree$,
    scrollIntoView: state$,
    // andre's stuff is broke for now
    // sendUpdate: state$.map((state : Model) =>
    //   keyboard
    //     .filter((x: Input) => x === 'increment' || x === 'decrement')
    //     .map((input : Input): Update => {
    //       const s = state.shows[state.cursor];
    //       return {
    //         name: s.name,
    //         input
    //       }
    //     }).debug((x: any) => console.log('debug', x)) // Object {name...}
    // ).debug((x: any) => console.log('debug2', x)) // Stream
    // .flatten()
    // .debug((x: any) => console.log('debug3', x)) // nothing
    sendUpdate: xs.combine(
      state$.compose(dropRepeats<Model>((a, b) => a.shows === b.shows)),
      keyboard.filter((x: Input) => x === 'increment' || x === 'decrement')
    )
      .compose(debounce(100))
      .map(([state, input]: [Model, Input]): Update => {
        const s = state.shows[state.cursor];
        return {
          name: s.name,
          count: s.count,
          input
        }
      })
  };
}

run(main, {
  DOM: makeDOMDriver('#app'),
  keyboard: makeKeyboardDriver(),
  scrollIntoView: makeScrollIntoViewDriver(),
  sendUpdate: makeSendUpdateDriver()
});
