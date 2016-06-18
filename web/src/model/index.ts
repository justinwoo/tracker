import xs, {Stream} from 'xstream';

import {Input} from '../drivers/keyboard';

type Project = (x : Model) => Model;

export type Show = {
  name: string,
  count: string
}

export type Model = {
  shows: Show [],
  cursor: number
}

function model(action$ : Stream<void>, keyboard : Stream<Input>) : Stream<Model> {
  const shows$ : Stream<Project> = xs.of(window["showData"])
    .map(shows => (x : Model) => Object.assign({}, x, {
      shows
    }));
  const cursor$ : Stream<Project> = xs.merge(
    keyboard.filter(input => input === 'up')
      .map(input => (x : Model)  => Object.assign({}, x, {
        cursor: Math.min(x.shows.length - 1, x.cursor + 1)
      })),
    keyboard.filter(input => input === 'down')
      .map(_ => (x : Model) => Object.assign({}, x, {
        cursor: Math.max(0, x.cursor - 1)
      }))
  );

  const change$ : Stream<Project> = xs.merge(
    keyboard.filter(input => input === 'increment')
      .map(_ => (x: number) => x + 1),
    keyboard.filter(input => input === 'decrement')
      .map(_ => (x: number) => x - 1)
  ).map(op => (x : Model) => Object.assign({}, x, {
      shows: x.shows.map((s, i) => {
        if (i === x.cursor) {
          return Object.assign({}, s, {
            count: String(op(Number(s.count)))
          })
        } else {
          return s;
        }
      })
    })
  );

  return xs.merge(shows$, cursor$, change$)
    .fold<Model>((x : Model, f : Project) => f(x), {
      shows: [],
      cursor: 0
    })
}

export default model;
