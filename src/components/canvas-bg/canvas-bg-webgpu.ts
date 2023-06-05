import vertexShader from '../../assets/shaders/vertex.wgsl';
import fragmentShader from '../../assets/shaders/fragment.wgsl';

export const initCanvasBgWebGPU = async ({ canvas }: { canvas: HTMLCanvasElement }) => {
    const adapter = await navigator.gpu.requestAdapter();
    const device = await adapter?.requestDevice();

    if (!device) return;
    const context = canvas.getContext('webgpu') as GPUCanvasContext;

    const devicePixelRatio = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;
    const presentationFormat = navigator.gpu.getPreferredCanvasFormat();

    context.configure({
        device,
        format: presentationFormat,
        alphaMode: 'premultiplied',
    });

    const pipeline = device.createRenderPipeline({
        layout: 'auto',
        vertex: {
            module: device.createShaderModule({
                code: vertexShader,
            }),
            entryPoint: 'main',
        },
        fragment: {
            module: device.createShaderModule({
                code: fragmentShader,
            }),
            entryPoint: 'main',
            targets: [
                {
                    format: presentationFormat,
                },
            ],
        },
        primitive: {
            topology: 'triangle-list',
        },
    });

    function frame() {
        if (!device) return;

        const commandEncoder = device.createCommandEncoder();
        const textureView = context.getCurrentTexture().createView();

        const renderPassDescriptor: GPURenderPassDescriptor = {
            colorAttachments: [
                {
                    view: textureView,
                    clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
                    loadOp: 'clear',
                    storeOp: 'store',
                },
            ],
        };

        const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
        passEncoder.setPipeline(pipeline);
        passEncoder.draw(3, 1, 0, 0);
        passEncoder.end();

        device.queue.submit([commandEncoder.finish()]);
        requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
};
