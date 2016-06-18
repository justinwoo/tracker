import {Stream} from 'xstream';
import {
  div,
  h1,
  button,
  span,
  table,
  tbody,
  tr,
  td,
  VNode
} from '@cycle/dom';

import {Model} from '../model/index';

function view(state$: Stream<Model>) {
  return state$.map(({shows, cursor}) => {
    const rows = shows.map((show, i) => {
      return tr(i === cursor ? '.table-info' : '', [
        td([show.name]),
        td([show.count])
      ]);
    });

    const showsTable = div('.col-md-6 .col-sm-12', [
      table('.table', [
        tbody('.showsTableBody', rows)
      ])
    ]);

    return div([
      h1(["tracker"]),
      showsTable
    ])
  });
}

export default view;
