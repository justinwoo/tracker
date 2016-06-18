import xs, {Stream} from 'xstream';

import {Model} from '../model';

function makeScrollIntoViewDriver() {
  return function (state$ : Stream<Model>) {
    state$.addListener({
      next: (state) => {
        // chrome specific?
        const ele = (<any>document.querySelector(`.showsTableBody > tr:nth-child(${state.cursor})`))
        if (ele) {
          ele.scrollIntoViewIfNeeded();
        }
      },
      error: (err) => console.error(err),
      complete: () => console.error("complete?")
    })
  }
}

export default makeScrollIntoViewDriver;