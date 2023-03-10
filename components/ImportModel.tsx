import fragment_shader from '../shader/testFrag.glsl';
import vertex_shader from '../shader/testVer.glsl';
import { useEffect, useRef, useState } from "react";
import {
    LightPositions,
    ModelDetailedDataType,
    ProgramProps, StoringLoadedJsonType
} from "../type";
import { Scene } from "../lib/Scene";
import { Program } from "../lib/Program";
import { Clock } from "../lib/Clock";
import { Camera } from "../lib/Camera";
import { Controls } from "../lib/Controls";
import { Transforms } from "../lib/Transforms";
import { Light, LightsManager } from "../lib/Light";
import canvas from "./Canvas";

type Props = {
    modelObj: StoringLoadedJsonType;
}

const ImportModel = (props: Props) => {
    const { modelObj } = props;

    let canvas: HTMLCanvasElement,
        gl: WebGL2RenderingContext,
        program: ProgramProps,
        scene: Scene,
        clock: Clock,
        camera: Camera,
        transforms: Transforms,
        lights: LightsManager,
        lightPositions: LightPositions,
        //canvasの背景色
        clearColor: [number, number, number] = [0, 0, 0];
        // selectedModel: string;

    //canvasの設定
    const canvasRef = useRef<HTMLCanvasElement>(null);
    function getContext() {
        canvas = canvasRef.current as HTMLCanvasElement;
        return canvas.getContext('webgl2');
    }

    function configure() {
        gl = getContext() as WebGL2RenderingContext;
        gl.clearColor(...clearColor, 0);
        gl.clearDepth(1);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        //attribute, uniformのprogramへの配置を配列で処理
        const attributes = [
            'aVertexPosition',
            'aVertexNormal',
            'aVertexColor'
        ];
        const uniforms = [
            'uProjectionMatrix',
            'uModelViewMatrix',
            'uNormalMatrix',
            'uLightPosition',
            'uWireframe',
            'uLd',
            'uLs',
            'uKa',
            'uKd',
            'uKs',
            'uNs',
            'uD',
        ];
        //programの設定
        program = new Program(
            gl, vertex_shader, fragment_shader
        ).initProgram(attributes, uniforms);

        //scene, clock, camera, control, transform, light, textureの設定
        scene = new Scene(gl, program);
        clock = new Clock();
        camera = new Camera(Camera.ORBITING_TYPE); //TRACKING_TYPEへの切り替えはここ
        new Controls(camera, canvas);
        transforms = new Transforms(gl, program, camera, canvas);
        lights = new LightsManager();
        //シーン内の個々のライトのポジションを指定
        lightPositions = {
            farLeft: [-1, 1, -1],
            farRight: [1, 1, -1],
            nearLeft: [-1, 1, 1],
            nearRight: [1, 1, 1]
        };

        Object.keys(lightPositions).forEach(key => {
            const light = new Light(key);
            light.setPosition(lightPositions[key as keyof LightPositions]);
            light.setDiffuse([0.4, 0.4, 0.4]);
            light.setSpecular([0.4, 0.4, 0.4]);
            lights.add(light);
        });

        gl.uniform3fv(program.uLightPosition, lights.getArray('position')　as Iterable<number>);
        gl.uniform3fv(program.uLd, lights.getArray('diffuse')　as Iterable<number>);
        gl.uniform3fv(program.uLs, lights.getArray('specular')　as Iterable<number>);

        gl.uniform3fv(program.uKa, [1, 1, 1]);
        gl.uniform3fv(program.uKd, [1, 1, 1]);
        gl.uniform3fv(program.uKs, [1, 1, 1]);
        gl.uniform1f(program.uNs, 1);
        gl.uniform1f(program.uNi, 1);
    }

    function goHome() {
        camera.goHome([0, 0.5, 5]);
        camera.setFocus([0, 0, 0]);
        camera.setAzimuth(25);
        camera.setElevation(-10);
    }

    function loadModel() {
        scene.objects = [];
        scene.loadObject(modelObj);
        // selectedModel = model;
    }

    function load() {
        goHome();
        loadModel();
    }

    function draw() {
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        transforms.updatePerspective();


        try {
            scene.traverse((object: ModelDetailedDataType) => {
                if (!object.visible) return;
                if (object.alias === "BG_Cube.006_BG") return;
                transforms.calculateModelView();
                transforms.push();
                transforms.setMatrixUniforms();
                transforms.pop();

                //set uniforms
                gl.uniform1i(program.uWireframe, 0);
                gl.uniform3fv(program.uKa, object.Ka);
                gl.uniform3fv(program.uKd, object.Kd);
                gl.uniform3fv(program.uKs, object.Ks);
                gl.uniform1f(program.uNi, object.Ni);
                gl.uniform1f(program.uNs, object.Ns);
                gl.uniform1f(program.uD, object.d);

                //bind
                gl.bindVertexArray(object.vao);
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, object.ibo);

                if (object.wireframe) {
                    gl.uniform1f(program.uWireframe, 1);
                    gl.drawElements(gl.LINES, object.indices.length, gl.UNSIGNED_SHORT, 0);
                } else {
                    gl.uniform1f(program.uWireframe, 0);
                    gl.drawElements(gl.TRIANGLES, object.indices.length, gl.UNSIGNED_SHORT, 0)
                }
                //clean
                gl.bindVertexArray(null);
                gl.bindBuffer(gl.ARRAY_BUFFER, null);
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
            });
        } catch (error) {
            console.error(error);
        }
    }

    function init() {
        configure();
        load();
        clock.on('tick', draw);
    }

    useEffect(() => {
        init();
    }, []);

    //リサイズ時にcanvasサイズ調整
    const [ canvasSize, setCanvasSize ] = useState({
        width: 0, height: 0,
    });
    useEffect(() => {
        const handleResize = () => {
            setCanvasSize({
                width: window.innerWidth,
                height: window.innerHeight,
            })
        }
        window.addEventListener('resize', handleResize);
        if (canvasRef.current !== null) {
            canvasRef.current.width = window.innerWidth;
            canvasRef.current.height = window.innerHeight;
        }
    }, [
        //↓コメントアウト外すと機能するが処理が非常に重い。
        // canvasSize
    ]);
    return (
        <>
            <canvas
                className='webgl-canvas relative'
                ref={canvasRef}
            ></canvas>
        </>
    );
};

export default ImportModel;
