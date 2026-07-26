/**
 * Safe math expression evaluator (no eval).
 * Supports: +, -, *, /, parentheses, decimals.
 * Returns NaN for invalid expressions.
 *
 * evaluateExpression("500*3")       → 1500
 * evaluateExpression("1000+500")    → 1500
 * evaluateExpression("(500+200)*3") → 2100
 * evaluateExpression("abc")         → NaN
 */

function tokenize(expr) {
  const tokens = [];
  let i = 0;
  while (i < expr.length) {
    const ch = expr[i];
    if (ch === ' ') { i++; continue; }
    if ('+-*/()'.includes(ch)) {
      tokens.push(ch);
      i++;
    } else if ((ch >= '0' && ch <= '9') || ch === '.') {
      let num = '';
      while (i < expr.length && ((expr[i] >= '0' && expr[i] <= '9') || expr[i] === '.')) {
        num += expr[i++];
      }
      tokens.push(parseFloat(num));
    } else {
      return null;
    }
  }
  return tokens;
}

function parseExpr(tokens, pos) {
  let { value, pos: nextPos } = parseTerm(tokens, pos);
  while (nextPos < tokens.length && (tokens[nextPos] === '+' || tokens[nextPos] === '-')) {
    const op = tokens[nextPos++];
    const right = parseTerm(tokens, nextPos);
    nextPos = right.pos;
    value = op === '+' ? value + right.value : value - right.value;
  }
  return { value, pos: nextPos };
}

function parseTerm(tokens, pos) {
  let { value, pos: nextPos } = parseFactor(tokens, pos);
  while (nextPos < tokens.length && (tokens[nextPos] === '*' || tokens[nextPos] === '/')) {
    const op = tokens[nextPos++];
    const right = parseFactor(tokens, nextPos);
    nextPos = right.pos;
    value = op === '*' ? value * right.value : value / right.value;
  }
  return { value, pos: nextPos };
}

function parseFactor(tokens, pos) {
  if (pos >= tokens.length) return { value: NaN, pos };
  if (tokens[pos] === '(') {
    const result = parseExpr(tokens, pos + 1);
    if (result.pos < tokens.length && tokens[result.pos] === ')') {
      return { value: result.value, pos: result.pos + 1 };
    }
    return { value: NaN, pos };
  }
  if (typeof tokens[pos] === 'number') {
    return { value: tokens[pos], pos: pos + 1 };
  }
  return { value: NaN, pos };
}

export function evaluateExpression(str) {
  if (!str || typeof str !== 'string') return NaN;
  const cleaned = str.replace(/\s/g, '');
  if (!cleaned) return NaN;
  const tokens = tokenize(cleaned);
  if (!tokens) return NaN;
  const result = parseExpr(tokens, 0);
  return result.pos === tokens.length ? result.value : NaN;
}

export function formatAmountPreview(str) {
  const val = evaluateExpression(str);
  if (isNaN(val)) return null;
  return `= ₹${val.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}
