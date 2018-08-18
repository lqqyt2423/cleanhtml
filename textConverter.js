'use strict';

const { blockElements } = require('./utils');

function textConverter(node) {
  const { name, s = [] } = node;
  if (blockElements.indexOf(name) > -1) s.push('\n');
  return s.join('');
}

module.exports = textConverter;
