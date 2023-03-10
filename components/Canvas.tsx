import { useEffect, useRef } from "react";
import { mat4 } from 'gl-matrix';
import fragment_shader from '../shader/fragment.glsl';
import vertex_shader from '../shader/vertex.glsl';
import { Utils } from "../lib/Utils";
import { ProgramProps } from "../type";
import {Program} from "../lib/Program";

const Canvas = () => {
    let gl: WebGL2RenderingContext,
        program: ProgramProps,
        geometryVertexBuffer: WebGLBuffer | null,
        geometryIndexBuffer: WebGLBuffer | null,
        geometryVAO: WebGLVertexArrayObject | null,
        indices: Array<number>,
        shininess = 10,
        lightColor = [1, 1, 1, 1],
        lightAmbient = [0.03, 0.03, 0.03, 1],
        lightSpecular = [1, 1, 1, 1],
        lightDirection = [-0.25, -0.25, -0.25],
        materialDiffuse = [46 / 256, 99 / 256, 191 / 256, 1],
        materialAmbient = [1, 1, 1, 1],
        materialSpecular = [1, 1, 1, 1],
        cameraMatrix = mat4.create(),
        modelViewMatrix = mat4.create(),
        projectionMatrix = mat4.create(),
        normalMatrix = mat4.create();

    const canvasRef = useRef(null);
    function getContext() {
        const canvas = canvasRef.current as unknown as HTMLCanvasElement;
        return canvas.getContext('webgl2');
    }

    //shaderとprogramのsetup
    function initShaderAndProgram() {
        const attributes = [
            'aVertexPosition',
            'aVertexNormal',
        ];
        const uniforms = [
            'uProjectionMatrix',
            'uModelViewMatrix',
            'uShininess',
            'uNormalMatrix',
            'uMaterialAmbient',
            'uMaterialDiffuse',
            'uMaterialSpecular',
            'uLightDirection',
            'uLightAmbient',
            'uLightDiffuse',
            'uLightSpecular',
        ];
        program = new Program(
            gl, vertex_shader, fragment_shader
        ).initProgram(attributes, uniforms);
    }
    function initLight() {
        gl.uniform4fv(program.uLightDiffuse, lightColor);
        gl.uniform4fv(program.uLightAmbient, lightAmbient);
        gl.uniform4fv(program.uLightSpecular, lightSpecular);
        gl.uniform3fv(program.uLightDirection, lightDirection);
        gl.uniform4fv(program.uMaterialDiffuse, materialDiffuse);
        gl.uniform4fv(program.uMaterialSpecular, materialSpecular);
        gl.uniform4fv(program.uMaterialAmbient, materialAmbient);
        gl.uniform1f(program.uShininess, shininess);
    }

    //ジオメトリ作成
    function initBuffer() {
        const vertices = [
            1.5, 0, 0,
            -1.5, 1, 0,
            -1.5, 0.809017, 0.587785,
            -1.5, 0.309017, 0.951057,
            -1.5, -0.309017, 0.951057,
            -1.5, -0.809017, 0.587785,
            -1.5, -1, 0,
            -1.5, -0.809017, -0.587785,
            -1.5, -0.309017, -0.951057,
            -1.5, 0.309017, -0.951057,
            -1.5, 0.809017, -0.587785
        ];

        indices = [
            0, 1, 2,
            0, 2, 3,
            0, 3, 4,
            0, 4, 5,
            0, 5, 6,
            0, 6, 7,
            0, 7, 8,
            0, 8, 9,
            0, 9, 10,
            0, 10, 1
        ];
        const normals = new Utils().calculateNormals(vertices, indices);
        //VAO
        geometryVAO = gl.createVertexArray();
        gl.bindVertexArray(geometryVAO);
        //VBO
        geometryVertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, geometryVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        //draw内で使用する為、VAOの命令を実行
        gl.enableVertexAttribArray(program.aVertexPosition);
        gl.vertexAttribPointer(program.aVertexPosition, 3, gl.FLOAT, false, 0, 0);
        //normals
        const geometryNormalsBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, geometryNormalsBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(program.aVertexNormal);
        gl.vertexAttribPointer(program.aVertexNormal, 3, gl.FLOAT, false, 0, 0);
        //IBO
        geometryIndexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, geometryIndexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
        //clean
        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    }
    //描写
    function draw() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        //setup camera
        mat4.perspective(projectionMatrix, 45, gl.canvas.width / gl.canvas.height, 0.1, 10000);
        mat4.identity(modelViewMatrix);
        mat4.translate(modelViewMatrix, modelViewMatrix, [0, 0, -5]);
        gl.uniformMatrix4fv(program.uProjectionMatrix, false, projectionMatrix);
        gl.uniformMatrix4fv(program.uModelViewMatrix, false, modelViewMatrix);

        mat4.copy(normalMatrix, modelViewMatrix);
        mat4.invert(normalMatrix, normalMatrix);
        mat4.transpose(normalMatrix, normalMatrix);

        gl.uniformMatrix4fv(program.uNormalMatrix, false, normalMatrix);
        gl.uniformMatrix4fv(program.uModelViewMatrix, false, modelViewMatrix);
        gl.uniformMatrix4fv(program.uProjectionMatrix, false, projectionMatrix);

        //bind VAO, IBO
        gl.bindVertexArray(geometryVAO);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, geometryIndexBuffer);
        //描画
        gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
        //clear
        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    }

    function configure() {
        gl = getContext() as WebGL2RenderingContext;
        gl.clearColor(0.9, 0.9, 0.9, 1);
        gl.clearDepth(100);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);

        initShaderAndProgram();
        initBuffer();
        initLight();
        draw();
    }

    useEffect(() => {
        configure();
    }, []);
    return (
        <div>
            <canvas className='webgl-canvas' ref={canvasRef} width={1000} height={600}/>
        </div>
    )
}

export default Canvas;