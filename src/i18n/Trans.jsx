import { Fragment } from 'react'

// Строка словаря с выделенными кусками: 'Новые материалы — **без доплат**'.
// Предложение не дробится на несколько ключей — переводчик видит его целиком.
// mark — как нарисовать выделенный кусок (по умолчанию <strong>).
export default function Trans({ text, mark = (chunk) => <strong>{chunk}</strong> }) {
  return String(text)
    .split('**')
    .map((chunk, i) => <Fragment key={i}>{i % 2 === 1 ? mark(chunk) : chunk}</Fragment>)
}
