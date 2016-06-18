import xs, {Stream} from 'xstream';

import {DOMSource} from '@cycle/dom/xstream-typings';

function intent(DOM: DOMSource) : Stream<void> {
  return xs.of(null);
}

export default intent;
