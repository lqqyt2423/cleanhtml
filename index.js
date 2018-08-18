'use strict';

const htmlparser = require('htmlparser2');
const Stack = require('./stack');
const htmlConverter = require('./htmlConverter');
const textConverter = require('./textConverter');

const converters = {
  htmlConverter,
  textConverter,
};

// 需要忽略的 html 元素
const voidElements = ['head', 'meta', 'link', 'area', 'base', 'br', 'col', 'command', 'embed', 'input', 'keygen', 'param', 'source', 'track', 'wbr', 'script', 'title', 'style'];

// 忽略标签，不忽略内容
const toTextElements = ['span', 'html', 'body'];

module.exports = function cleanhtml(html, options = {}) {
  // mode => html md text
  const { mode = 'html' } = options;
  if (['html', 'md', 'text'].indexOf(mode) === -1) throw new Error('mode 仅支持 html, md 和 text');
  if (mode === 'md') throw new Error('暂未支持 md');

  const converter = converters[`${mode}Converter`];

  // 控制 stack
  const stack = new Stack(converter);

  // 控制忽略元素
  const voidObj = {};
  voidElements.forEach((item) => {
    voidObj[item] = false;
  });

  // 忽略 display 为 none 的元素及其子元素
  let isHide = false;
  // 隐藏后的计数，当再次为0时，隐藏标签结束
  let hideCount = 0;
  const hideRegex = /display:\s*?none/;


  const parser = new htmlparser.Parser({

    onopentag(name, attr) {
      name = name.toLowerCase();

      // 忽略此元素标签
      if (toTextElements.indexOf(name) > -1) return;

      // 忽略元素及其中的内容，包括子元素
      if (voidElements.indexOf(name) > -1) {
        voidObj[name] = true;
        return;
      }
      for (const item of voidElements) {
        if (voidObj[item]) return;
      }

      // 忽略 display 为 none 的元素及其子元素
      if (isHide) {
        hideCount += 1;
        return;
      }
      if (attr.style) {
        if (hideRegex.test(attr.style)) {
          isHide = true;
          hideCount += 1;
          return;
        }
      }

      stack.in({
        name,
        attr,
        s: [],
      });
    },

    onclosetag(name) {
      name = name.toLowerCase();

      // 忽略此元素标签
      if (toTextElements.indexOf(name) > -1) return;

      // 忽略元素及其中的内容，包括子元素
      if (voidElements.indexOf(name) > -1) {
        voidObj[name] = false;
        return;
      }
      for (const item of voidElements) {
        if (voidObj[item]) return;
      }

      // 忽略 display 为 none 的元素及其子元素
      if (isHide) {
        hideCount -= 1;
        if (hideCount === 0) {
          isHide = false;
        }
        return;
      }

      stack.out();
    },

    ontext(text) {
      // 忽略元素及其中的内容，包括子元素
      for (const item of voidElements) {
        if (voidObj[item]) return;
      }

      // 忽略 display 为 none 的元素及其子元素
      if (isHide) return;

      text = text.trim();
      stack.add(text);
    },
  }, { decodeEntities: mode !== 'html' });

  parser.end(html);

  let str = stack.getStr();
  if (mode === 'text') {
    str = str.replace(/\n{2,}/g, '\n');
    str = str.trim();
  }
  return str;
};
