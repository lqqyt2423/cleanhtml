'use strict';

const htmlparser = require('htmlparser2');

// 需要忽略的 html 元素
const voidElements = ['head', 'meta', 'link', 'area', 'base', 'br', 'col', 'command', 'embed', 'input', 'keygen', 'param', 'source', 'track', 'wbr', 'script', 'title', 'style'];

// 替换为 p 的元素
const toPElements = ['p', 'div', 'header', 'section', 'article', 'aside', 'footer', 'nav'];

// 忽略标签，不忽略内容
const toTextElements = ['span', 'html', 'body'];

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

class Stack {
  constructor() {
    this.stack = [];
    this.s = [];
    this.depth = -1;
  }

  in(i) {
    this.stack.push(i);
    this.depth += 1;
  }

  out(s = '') {
    const i = this.stack.pop();
    this.depth -= 1;

    i.s.push(s);
    const str = i.s.join('');
    if (this.depth === -1) {
      this.s.push(str);
    } else {
      this.stack[this.depth].s.push(str);
    }
  }

  add(s = '') {
    if (!s) return;
    if (this.depth === -1) {
      this.s.push(s);
      return;
    }
    this.stack[this.depth].s.push(s);
  }

  parentIsE(name) {
    if (this.depth === -1) return false;
    return this.stack[this.depth].name === name;
  }

  getStr() {
    console.log('depth:', this.depth);
    return this.s.join('');
  }
}

module.exports = function cleanhtml(html) {
  // 控制 stack
  const stack = new Stack();

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

      // img 标签
      if (name === 'img') {
        let attrString = attrStringify(attr);
        if (attrString) attrString = ` ${attrString}`;

        stack.in({
          name,
          s: [`<img${attrString} />`],
        });
        return;
      }

      // a 标签
      if (name === 'a') {
        let attrString = attrStringify(attr);
        if (attrString) attrString = ` ${attrString}`;

        stack.in({
          name,
          s: [`<a${attrString}>`],
        });
        return;
      }

      // 替换块状元素为 p 的元素
      let tag = name;
      if (toPElements.indexOf(name) > -1) {
        tag = 'p';
      }

      stack.in({
        name: tag,
        s: [`<${tag}>`],
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

      // img 标签
      if (name === 'img') {
        stack.out();
        return;
      }

      // 替换块状元素为 p 的元素
      let tag = name;
      if (toPElements.indexOf(name) > -1) {
        tag = 'p';
      }

      let tmpStr = `</${tag}>`;
      if (tag === 'p') tmpStr += '\n';
      stack.out(tmpStr);
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
  }, { decodeEntities: false });

  parser.end(html);

  return stack.getStr();
};
