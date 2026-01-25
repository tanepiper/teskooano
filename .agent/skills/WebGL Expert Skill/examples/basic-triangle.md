# Basic Triangle Example

Complete example of rendering a colored triangle with WebGL.

## HTML Setup

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>WebGL Triangle</title>
    <style>
        body { margin: 0; overflow: hidden; }
        canvas { display: block; width: 100vw; height: 100vh; }
    </style>
</head>
<body>
    <canvas id="glCanvas"></canvas>
    <script src="triangle.js"></script>
</body>
</html>
```

## JavaScript Implementation

```javascript
// triangle.js

function main() {
    const canvas = document.getElementById('glCanvas');
    const gl = canvas.getContext('webgl');

    if (!gl) {
        alert('WebGL not supported');
        return;
    }

    // Vertex shader (GLSL)
    const vsSource = `
        attribute vec4 aVertexPosition;
        attribute vec4 aVertexColor;
        varying lowp vec4 vColor;

        void main() {
            gl_Position = aVertexPosition;
            vColor = aVertexColor;
        }
    `;

    // Fragment shader (GLSL)
    const fsSource = `
        varying lowp vec4 vColor;

        void main() {
            gl_FragColor = vColor;
        }
    `;

    // Compile shader
    function compileShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    // Create shader program
    function createProgram(gl, vsSource, fsSource) {
        const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vsSource);
        const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fsSource);

        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('Program linking error:', gl.getProgramInfoLog(program));
            return null;
        }
        return program;
    }

    // Create the shader program
    const shaderProgram = createProgram(gl, vsSource, fsSource);

    // Get attribute and uniform locations
    const programInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
            vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor'),
        },
    };

    // Triangle vertices (x, y, z)
    const positions = [
         0.0,  0.5, 0.0,  // Top
        -0.5, -0.5, 0.0,  // Bottom left
         0.5, -0.5, 0.0,  // Bottom right
    ];

    // Vertex colors (r, g, b, a)
    const colors = [
        1.0, 0.0, 0.0, 1.0,  // Red
        0.0, 1.0, 0.0, 1.0,  // Green
        0.0, 0.0, 1.0, 1.0,  // Blue
    ];

    // Create position buffer
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    // Create color buffer
    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    // Render scene
    function drawScene(gl, programInfo, positionBuffer, colorBuffer) {
        // Resize canvas to display size
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);

        // Clear canvas
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        // Use our shader program
        gl.useProgram(programInfo.program);

        // Set up position attribute
        {
            const numComponents = 3;  // x, y, z
            const type = gl.FLOAT;
            const normalize = false;
            const stride = 0;
            const offset = 0;

            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
            gl.vertexAttribPointer(
                programInfo.attribLocations.vertexPosition,
                numComponents,
                type,
                normalize,
                stride,
                offset
            );
            gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
        }

        // Set up color attribute
        {
            const numComponents = 4;  // r, g, b, a
            const type = gl.FLOAT;
            const normalize = false;
            const stride = 0;
            const offset = 0;

            gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
            gl.vertexAttribPointer(
                programInfo.attribLocations.vertexColor,
                numComponents,
                type,
                normalize,
                stride,
                offset
            );
            gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor);
        }

        // Draw the triangle
        {
            const offset = 0;
            const vertexCount = 3;
            gl.drawArrays(gl.TRIANGLES, offset, vertexCount);
        }
    }

    // Render the scene
    drawScene(gl, programInfo, positionBuffer, colorBuffer);
}

// Start when DOM is ready
window.addEventListener('load', main);
```

## Key Concepts Demonstrated

1. **WebGL Context** - Obtaining the rendering context from canvas
2. **Shaders** - Writing and compiling GLSL vertex and fragment shaders
3. **Program Creation** - Linking shaders into a program
4. **Buffers** - Creating and filling buffers with vertex data
5. **Attributes** - Setting up vertex attributes (position, color)
6. **Drawing** - Using `drawArrays` to render primitives

## Output

A triangle with:
- Red vertex at the top
- Green vertex at bottom left
- Blue vertex at bottom right
- Smooth color interpolation between vertices

## Next Steps

- Add animation (rotate the triangle)
- Add user interaction (mouse/keyboard controls)
- Add depth testing and 3D coordinates
- Add textures instead of vertex colors
- Implement a transformation matrix
