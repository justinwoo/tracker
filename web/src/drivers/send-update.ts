import xs, {Stream} from 'xstream';

import {Input} from './keyboard';

export type Update = {
  name: string,
  count: string,
  input: Input
}

function makeSendUpdateDriver() {
  return function (update$: Stream<Update>) {
    update$.addListener({
      next: (x) => {
        console.log('update', x)
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${x.input}`, true);
        xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        xhr.send(`name=${x.name}`);
      },
      error: (err) => console.error(err),
      complete: () => console.error("completed?")
    });
  }
}

export default makeSendUpdateDriver;