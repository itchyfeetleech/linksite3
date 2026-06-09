/* ════════════════════════════════════════════════════════════════
   DOM helpers — tiny element factory + staggered line reveal.
   ════════════════════════════════════════════════════════════════ */

export function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text != null) node.textContent = text;
  return node;
}

/* Append .line divs with a per-line reveal delay (CSS handles timing).
   Returns the created elements so callers can decorate them. */
export function revealLines(container, specs, startIndex = 0) {
  const frag = document.createDocumentFragment();
  const nodes = specs.map((spec, i) => {
    const node = spec.node || el(spec.tag || 'div', 'line reveal' + (spec.cls ? ' ' + spec.cls : ''), spec.text ?? '');
    if (spec.node) node.classList.add('line', 'reveal');
    node.style.setProperty('--i', startIndex + i);
    frag.append(node);
    return node;
  });
  container.append(frag);
  return nodes;
}
