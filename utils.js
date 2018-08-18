'use strict';

const blockElements = [
  'address', 'article', 'aside', 'blockquote', 'body', 'canvas',
  'center', 'dir', 'div', 'fieldset', 'figcaption',
  'figure', 'footer', 'form', 'frameset', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'header', 'hgroup', 'hr', 'html', 'isindex', 'main', 'menu', 'nav',
  'noframes', 'noscript', 'ol', 'output', 'p', 'pre', 'section', 'table',
  'ul',
];

const blockElementsRegExp = new RegExp(`^<(${blockElements.join('|')}).*`, 'i');

module.exports = {
  blockElements,
  blockElementsRegExp,
};
