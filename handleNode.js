'use strict';

// 替换为 div 的元素
const toDivElements = ['header', 'section', 'article', 'aside', 'footer', 'nav'];

const blockElements = [
  'address', 'article', 'aside', 'blockquote', 'body', 'canvas',
  'center', 'dir', 'div', 'fieldset', 'figcaption',
  'figure', 'footer', 'form', 'frameset', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'header', 'hgroup', 'hr', 'html', 'isindex', 'main', 'menu', 'nav',
  'noframes', 'noscript', 'ol', 'output', 'p', 'pre', 'section', 'table',
  'ul',
];

const blockElementsRegExp = new RegExp(`^<(${blockElements.join('|')}).*`, 'i');

// 序列化 attr
const attrStringify = (attr) => {
  // return '';
  const a = [];
  Object.keys(attr).forEach((key) => {
    const val = attr[key];

    // replace
    if (!attr.src && /src/.test(key)) {
      key = 'src';
      attr.src = val;
    }

    const keepKeys = ['href', 'title', 'alt', 'src'];
    if (keepKeys.indexOf(key) === -1) return;

    if (val) a.push(`${key}="${attr[key]}"`);
  });
  return a.join(' ');
};

// params {Object} node
// params {Stack} stack
// returns {String}
module.exports = function handleNode(node, stack) {
  const { name, attr = {} } = node;
  let { s = [] } = node;

  if (name === 'img') {
    let attrString = attrStringify(attr);
    if (attrString) attrString = ` ${attrString}`;
    return `<img${attrString} />`;
  }

  // 过滤掉空的标签
  s = s.filter(i => i);
  if (!s.length) return '';

  if (name === 'a') {
    let attrString = attrStringify(attr);
    if (attrString) attrString = ` ${attrString}`;
    s.unshift(`<a${attrString}>`);
    s.push('</a>');
    return s.join('');
  }

  // 去除嵌套的 strong
  if (name === 'strong') {
    const parentNode = stack.peek();
    if (parentNode && parentNode.name === 'strong') return s.join('');
  }

  // 替换块状元素为 div 的元素
  let tag = name;
  if (toDivElements.indexOf(name) > -1) tag = 'div';

  // 如果子元素都在块状标签内，则忽略此标签
  const x = s.every(str => blockElementsRegExp.test(str));
  if (!x) {
    s.unshift(`<${tag}>`);
    s.push(`</${tag}>`);
    if (blockElements.indexOf(name) > -1) s.push('\n\n');
  }

  return s.join('');
};
