export function getTranslation(node: Element): [number, number, number] {
  return (node.getAttribute('translation') || '0 0 0').split(' ').map(Number) as [number, number, number];
}

export function setTranslation(node: Element, x: number, y: number, z: number) {
  node.setAttribute('translation', `${x.toFixed(3)} ${y.toFixed(3)} ${z.toFixed(3)}`);
}

export function getBoxSize(node: Element): [number, number, number] {
  const box = node.querySelector('box');
  if (!box) return [1, 1, 1];
  return (box.getAttribute('size') || '1 1 1').split(' ').map(Number) as [number, number, number];
}
