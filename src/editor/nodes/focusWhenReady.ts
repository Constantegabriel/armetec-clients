/**
 * O React Flow mantém um bloco recém-criado invisível até medir seu tamanho,
 * e elementos invisíveis não recebem foco. Tenta por alguns quadros até conseguir.
 */
export function focusWhenReady(el: HTMLInputElement | HTMLTextAreaElement, onDone: () => void, attempts = 20) {
  el.focus({ preventScroll: true });
  if (document.activeElement === el || attempts <= 0) {
    const end = el.value.length;
    el.setSelectionRange(end, end);
    onDone();
    return;
  }
  requestAnimationFrame(() => focusWhenReady(el, onDone, attempts - 1));
}
