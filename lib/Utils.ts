import { ReadonlyVec3, vec3 } from "gl-matrix";
import {useEffect} from "react";

export class Utils {
    resizeCanvas(canvas: HTMLCanvasElement) {
        const expandFullScreen = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        expandFullScreen();

    }
    calculateNormals(vs: Array<number>, ind: Array<number>) {
        const
            x = 0,
            y = 1,
            z = 2,
            ns = [];

        // For each vertex, initialize normal x, normal y, normal z
        for (let i = 0; i < vs.length; i += 3) {
            ns[i + x] = 0.0;
            ns[i + y] = 0.0;
            ns[i + z] = 0.0;
        }

        // We work on triads of vertices to calculate
        for (let i = 0; i < ind.length; i += 3) {
            // Normals so i = i+3 (i = indices index)
            const v1 = [], v2 = [], normal = [];

            // p2 - p1
            v1[x] = vs[3 * ind[i + 2] + x] - vs[3 * ind[i + 1] + x];
            v1[y] = vs[3 * ind[i + 2] + y] - vs[3 * ind[i + 1] + y];
            v1[z] = vs[3 * ind[i + 2] + z] - vs[3 * ind[i + 1] + z];

            // p0 - p1
            v2[x] = vs[3 * ind[i] + x] - vs[3 * ind[i + 1] + x];
            v2[y] = vs[3 * ind[i] + y] - vs[3 * ind[i + 1] + y];
            v2[z] = vs[3 * ind[i] + z] - vs[3 * ind[i + 1] + z];

            // Cross product by Sarrus Rule
            normal[x] = v1[y] * v2[z] - v1[z] * v2[y];
            normal[y] = v1[z] * v2[x] - v1[x] * v2[z];
            normal[z] = v1[x] * v2[y] - v1[y] * v2[x];

            // Update the normals of that triangle: sum of vectors
            for (let j = 0; j < 3; j++) {
                ns[3 * ind[i + j] + x] = ns[3 * ind[i + j] + x] + normal[x];
                ns[3 * ind[i + j] + y] = ns[3 * ind[i + j] + y] + normal[y];
                ns[3 * ind[i + j] + z] = ns[3 * ind[i + j] + z] + normal[z];
            }
        }

        // Normalize the result.
        // The increment here is because each vertex occurs.
        for (let i = 0; i < vs.length; i += 3) {
            // With an offset of 3 in the array (due to x, y, z contiguous values)
            const nn = [];
            nn[x] = ns[i + x];
            nn[y] = ns[i + y];
            nn[z] = ns[i + z];

            let len = Math.sqrt((nn[x] * nn[x]) + (nn[y] * nn[y]) + (nn[z] * nn[z]));
            if (len === 0) len = 1.0;

            nn[x] = nn[x] / len;
            nn[y] = nn[y] / len;
            nn[z] = nn[z] / len;

            ns[i + x] = nn[x];
            ns[i + y] = nn[y];
            ns[i + z] = nn[z];
        }
        return ns;
    };

    calculateTangents(vs: Array<number>, tc: Array<number>, ind: Array<number>) {
        const tangents: Array<vec3> = [];

        for (let i = 0; i < vs.length / 3; i++) {
            tangents[i] = [0, 0, 0] as vec3;
        }

        let
            a: vec3 = [0, 0, 0],
            b: vec3 = [0, 0, 0],
            triTangent: vec3 = [0, 0, 0];

        for (let i = 0; i < ind.length; i += 3) {
            const i0: number = ind[i];
            const i1: number = ind[i + 1];
            const i2: number = ind[i + 2];

            const pos0: ReadonlyVec3 = [vs[i0 * 3], vs[i0 * 3 + 1], vs[i0 * 3 + 2]];
            const pos1: ReadonlyVec3 = [vs[i1 * 3], vs[i1 * 3 + 1], vs[i1 * 3 + 2]];
            const pos2: ReadonlyVec3 = [vs[i2 * 3], vs[i2 * 3 + 1], vs[i2 * 3 + 2]];

            const tex0: Array<number> = [tc[i0 * 2], tc[i0 * 2 + 1]];
            const tex1: Array<number> = [tc[i1 * 2], tc[i1 * 2 + 1]];
            const tex2: Array<number> = [tc[i2 * 2], tc[i2 * 2 + 1]];

            vec3.subtract(a, pos1, pos0);
            vec3.subtract(b, pos2, pos0);

            const c2c1b: number = tex1[1] - tex0[1];
            const c3c1b: number = tex2[0] - tex0[1];

            triTangent = [c3c1b * a[0] - c2c1b * b[0], c3c1b * a[1] - c2c1b * b[1], c3c1b * a[2] - c2c1b * b[2]];

            vec3.add(triTangent, tangents[i0], triTangent);
            vec3.add(triTangent, tangents[i1], triTangent);
            vec3.add(triTangent, tangents[i2], triTangent);
        }

        // Normalize tangents
        const ts: Array<number> = [];
        tangents.forEach(tan => {
            vec3.normalize(tan, tan);
            ts.push(tan[0]);
            ts.push(tan[1]);
            ts.push(tan[2]);
        });
        return ts;
    }
}

