import type { Collider } from '../../engine/physics';
import { ColliderType } from '../../engine/collision';
import type { Vec2, Vec3 } from '../../engine/types';
import type { ModelDefinition } from '../../game/ModelLoader';

export function createStairs(model: ModelDefinition): Collider[] {
  const scene: Element | null = document.querySelector('scene');
  if (!scene) return [];

  const steps = Math.max(1, (model.value as number | undefined) ?? 5);
  const strideX = model.step?.x ?? model.size.x;
  const strideY = model.step?.y ?? model.size.y;
  const colliders: Collider[] = [];

  for (let i = 0; i < steps; i++) {
    const stepPos: Vec3 = {
      x: model.position.x + i * strideX,
      y: model.position.y + i * strideY,
      z: model.position.z
    };

    const transform: Element = document.createElementNS('http://www.web3d.org/specifications/x3d-namespace', 'Transform');
    transform.setAttribute('translation', `${stepPos.x} ${stepPos.y} ${stepPos.z}`);
    transform.setAttribute('class', 'platform');
    transform.setAttribute('id', `${model.id}_step_${i}`);

    const shape: Element = document.createElementNS('http://www.web3d.org/specifications/x3d-namespace', 'Shape');
    const appearance: Element = document.createElementNS('http://www.web3d.org/specifications/x3d-namespace', 'Appearance');
    const material: Element = document.createElementNS('http://www.web3d.org/specifications/x3d-namespace', 'Material');
    material.setAttribute('diffuseColor', model.color || '0.85 0.75 0.55');
    material.setAttribute('specularColor', '0.1 0.1 0.1');
    material.setAttribute('shininess', '0.05');
    appearance.appendChild(material);
    shape.appendChild(appearance);
    const box: Element = document.createElementNS('http://www.web3d.org/specifications/x3d-namespace', 'Box');
    box.setAttribute('size', `${model.size.x} ${model.size.y} ${model.size.z}`);
    shape.appendChild(box);
    transform.appendChild(shape);
    scene.appendChild(transform);

    colliders.push({
      pos: stepPos,
      size: model.size,
      type: 'platform',
      colliderType: ColliderType.SOLID
    });
  }
  return colliders;
}

