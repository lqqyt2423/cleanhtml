'use strict';

const handleNode = require('./handleNode');

// 管理 html 节点信息
class Stack {
  constructor() {
    // obj
    // {String} name
    // {Object} attr
    // {String[]} s
    this.stack = [];
    this.s = [];
    this.depth = -1;
  }

  in(node) {
    this.stack.push(node);
    this.depth += 1;
  }

  out() {
    const node = this.stack.pop();
    this.depth -= 1;

    const str = handleNode(node, this);
    if (!str) return;
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

  getStr() {
    if (this.depth !== -1) throw new Error('depth 不为 -1');
    return this.s.join('');
  }

  peek() {
    if (this.depth > -1) return this.stack[this.depth];
    return null;
  }
}

module.exports = Stack;
