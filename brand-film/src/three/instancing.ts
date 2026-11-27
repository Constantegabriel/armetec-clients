import {useMemo} from 'react';
import * as THREE from 'three';

/** Static instanced mesh built once from matrices (render via <primitive object>). */
export const useInstanced = (geo: THREE.BufferGeometry, mat: THREE.Material, matrices: THREE.Matrix4[], castShadow = false) =>
  useMemo(() => {
    const m = new THREE.InstancedMesh(geo, mat, matrices.length);
    matrices.forEach((x, i) => m.setMatrixAt(i, x));
    m.instanceMatrix.needsUpdate = true;
    m.castShadow = castShadow;
    m.frustumCulled = false;
    return m;
  }, [geo, mat, matrices, castShadow]);
