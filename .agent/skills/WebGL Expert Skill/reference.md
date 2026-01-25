# WebGL API Reference

## WebGL Constants

### Clear Buffer Bits
- `gl.COLOR_BUFFER_BIT` - 0x00004000
- `gl.DEPTH_BUFFER_BIT` - 0x00000100
- `gl.STENCIL_BUFFER_BIT` - 0x00000400

### Data Types
- `gl.BYTE` - 0x1400
- `gl.UNSIGNED_BYTE` - 0x1401
- `gl.SHORT` - 0x1402
- `gl.UNSIGNED_SHORT` - 0x1403
- `gl.INT` - 0x1404
- `gl.UNSIGNED_INT` - 0x1405
- `gl.FLOAT` - 0x1406

### Primitive Types
- `gl.POINTS` - 0x0000
- `gl.LINES` - 0x0001
- `gl.LINE_LOOP` - 0x0002
- `gl.LINE_STRIP` - 0x0003
- `gl.TRIANGLES` - 0x0004
- `gl.TRIANGLE_STRIP` - 0x0005
- `gl.TRIANGLE_FAN` - 0x0006

### Texture Targets
- `gl.TEXTURE_2D` - 0x0DE1
- `gl.TEXTURE_CUBE_MAP` - 0x8513
- `gl.TEXTURE_CUBE_MAP_POSITIVE_X` - 0x8515
- `gl.TEXTURE_CUBE_MAP_NEGATIVE_X` - 0x8516
- `gl.TEXTURE_CUBE_MAP_POSITIVE_Y` - 0x8517
- `gl.TEXTURE_CUBE_MAP_NEGATIVE_Y` - 0x8518
- `gl.TEXTURE_CUBE_MAP_POSITIVE_Z` - 0x8519
- `gl.TEXTURE_CUBE_MAP_NEGATIVE_Z` - 0x851A

### Texture Parameters
- `gl.TEXTURE_MIN_FILTER` - 0x2801
- `gl.TEXTURE_MAG_FILTER` - 0x2800
- `gl.TEXTURE_WRAP_S` - 0x2802
- `gl.TEXTURE_WRAP_T` - 0x2803

### Texture Filters
- `gl.NEAREST` - 0x2600
- `gl.LINEAR` - 0x2601
- `gl.NEAREST_MIPMAP_NEAREST` - 0x2700
- `gl.LINEAR_MIPMAP_NEAREST` - 0x2701
- `gl.NEAREST_MIPMAP_LINEAR` - 0x2702
- `gl.LINEAR_MIPMAP_LINEAR` - 0x2703

### Texture Wrap Modes
- `gl.REPEAT` - 0x2901
- `gl.CLAMP_TO_EDGE` - 0x812F
- `gl.MIRRORED_REPEAT` - 0x8370

### Pixel Formats
- `gl.ALPHA` - 0x1906
- `gl.RGB` - 0x1907
- `gl.RGBA` - 0x1908
- `gl.LUMINANCE` - 0x1909
- `gl.LUMINANCE_ALPHA` - 0x190A

### Shader Types
- `gl.FRAGMENT_SHADER` - 0x8B30
- `gl.VERTEX_SHADER` - 0x8B31

### Buffer Types
- `gl.ARRAY_BUFFER` - 0x8892
- `gl.ELEMENT_ARRAY_BUFFER` - 0x8893

### Buffer Usage
- `gl.STATIC_DRAW` - 0x88E4
- `gl.DYNAMIC_DRAW` - 0x88E8
- `gl.STREAM_DRAW` - 0x88E0

### Blend Functions
- `gl.ZERO` - 0
- `gl.ONE` - 1
- `gl.SRC_COLOR` - 0x0300
- `gl.ONE_MINUS_SRC_COLOR` - 0x0301
- `gl.DST_COLOR` - 0x0306
- `gl.ONE_MINUS_DST_COLOR` - 0x0307
- `gl.SRC_ALPHA` - 0x0302
- `gl.ONE_MINUS_SRC_ALPHA` - 0x0303
- `gl.DST_ALPHA` - 0x0304
- `gl.ONE_MINUS_DST_ALPHA` - 0x0305
- `gl.SRC_ALPHA_SATURATE` - 0x0308

### Depth Functions
- `gl.NEVER` - 0x0200
- `gl.LESS` - 0x0201
- `gl.EQUAL` - 0x0202
- `gl.LEQUAL` - 0x0203
- `gl.GREATER` - 0x0204
- `gl.NOTEQUAL` - 0x0205
- `gl.GEQUAL` - 0x0206
- `gl.ALWAYS` - 0x0207

### Culling
- `gl.FRONT` - 0x0404
- `gl.BACK` - 0x0405
- `gl.FRONT_AND_BACK` - 0x0408
- `gl.CULL_FACE` - 0x0B44

### Capabilities
- `gl.BLEND` - 0x0BE2
- `gl.DEPTH_TEST` - 0x0B71
- `gl.SCISSOR_TEST` - 0x0C11
- `gl.STENCIL_TEST` - 0x0B90
- `gl.DITHER` - 0x0BD0
- `gl.POLYGON_OFFSET_FILL` - 0x8037

### Framebuffer Targets
- `gl.FRAMEBUFFER` - 0x8D40
- `gl.RENDERBUFFER` - 0x8D41

### Framebuffer Attachments
- `gl.COLOR_ATTACHMENT0` - 0x8CE0
- `gl.DEPTH_ATTACHMENT` - 0x8D00
- `gl.STENCIL_ATTACHMENT` - 0x8D20
- `gl.DEPTH_STENCIL_ATTACHMENT` - 0x821A

### Errors
- `gl.NO_ERROR` - 0
- `gl.INVALID_ENUM` - 0x0500
- `gl.INVALID_VALUE` - 0x0501
- `gl.INVALID_OPERATION` - 0x0502
- `gl.OUT_OF_MEMORY` - 0x0505
- `gl.CONTEXT_LOST_WEBGL` - 0x9242

## WebGL Methods Quick Reference

### Context
- `canvas.getContext('webgl')` / `getContext('webgl2')`
- `gl.getExtension(name)`
- `gl.getSupportedExtensions()`

### Shaders & Programs
- `gl.createShader(type)`
- `gl.shaderSource(shader, source)`
- `gl.compileShader(shader)`
- `gl.getShaderParameter(shader, pname)`
- `gl.getShaderInfoLog(shader)`
- `gl.deleteShader(shader)`
- `gl.createProgram()`
- `gl.attachShader(program, shader)`
- `gl.linkProgram(program)`
- `gl.getProgramParameter(program, pname)`
- `gl.getProgramInfoLog(program)`
- `gl.useProgram(program)`
- `gl.deleteProgram(program)`

### Attributes
- `gl.getAttribLocation(program, name)`
- `gl.enableVertexAttribArray(index)`
- `gl.disableVertexAttribArray(index)`
- `gl.vertexAttribPointer(index, size, type, normalized, stride, offset)`
- `gl.vertexAttribDivisor(index, divisor)` - WebGL 2

### Uniforms
- `gl.getUniformLocation(program, name)`
- `gl.uniform1f(location, v0)`
- `gl.uniform2f(location, v0, v1)`
- `gl.uniform3f(location, v0, v1, v2)`
- `gl.uniform4f(location, v0, v1, v2, v3)`
- `gl.uniform1i(location, v0)`
- `gl.uniformMatrix2fv(location, transpose, value)`
- `gl.uniformMatrix3fv(location, transpose, value)`
- `gl.uniformMatrix4fv(location, transpose, value)`

### Buffers
- `gl.createBuffer()`
- `gl.bindBuffer(target, buffer)`
- `gl.bufferData(target, data, usage)`
- `gl.bufferSubData(target, offset, data)`
- `gl.deleteBuffer(buffer)`

### Textures
- `gl.createTexture()`
- `gl.bindTexture(target, texture)`
- `gl.texImage2D(target, level, internalformat, width, height, border, format, type, pixels)`
- `gl.texSubImage2D(target, level, xoffset, yoffset, width, height, format, type, pixels)`
- `gl.texParameteri(target, pname, param)`
- `gl.generateMipmap(target)`
- `gl.activeTexture(texture)`
- `gl.deleteTexture(texture)`

### Framebuffers
- `gl.createFramebuffer()`
- `gl.bindFramebuffer(target, framebuffer)`
- `gl.framebufferTexture2D(target, attachment, textarget, texture, level)`
- `gl.framebufferRenderbuffer(target, attachment, renderbuffertarget, renderbuffer)`
- `gl.checkFramebufferStatus(target)`
- `gl.deleteFramebuffer(framebuffer)`

### Renderbuffers
- `gl.createRenderbuffer()`
- `gl.bindRenderbuffer(target, renderbuffer)`
- `gl.renderbufferStorage(target, internalformat, width, height)`
- `gl.deleteRenderbuffer(renderbuffer)`

### Drawing
- `gl.clear(mask)`
- `gl.clearColor(r, g, b, a)`
- `gl.clearDepth(depth)`
- `gl.drawArrays(mode, first, count)`
- `gl.drawElements(mode, count, type, offset)`
- `gl.drawArraysInstanced(mode, first, count, instanceCount)` - WebGL 2
- `gl.drawElementsInstanced(mode, count, type, offset, instanceCount)` - WebGL 2

### State Management
- `gl.enable(cap)`
- `gl.disable(cap)`
- `gl.blendFunc(sfactor, dfactor)`
- `gl.blendFuncSeparate(srcRGB, dstRGB, srcAlpha, dstAlpha)`
- `gl.depthFunc(func)`
- `gl.depthMask(flag)`
- `gl.cullFace(mode)`
- `gl.frontFace(mode)`
- `gl.viewport(x, y, width, height)`
- `gl.scissor(x, y, width, height)`

### Queries
- `gl.getParameter(pname)`
- `gl.getError()`
- `gl.isEnabled(cap)`

## GLSL Built-in Functions

### Trigonometric
- `sin(x)`, `cos(x)`, `tan(x)`
- `asin(x)`, `acos(x)`, `atan(y, x)`
- `radians(degrees)`, `degrees(radians)`

### Exponential
- `pow(x, y)`, `exp(x)`, `exp2(x)`
- `log(x)`, `log2(x)`
- `sqrt(x)`, `inversesqrt(x)`

### Common
- `abs(x)`, `sign(x)`
- `floor(x)`, `ceil(x)`, `fract(x)`
- `mod(x, y)`, `min(x, y)`, `max(x, y)`
- `clamp(x, minVal, maxVal)`
- `mix(x, y, a)` - linear interpolation
- `step(edge, x)`, `smoothstep(edge0, edge1, x)`

### Geometric
- `length(v)`, `distance(p0, p1)`
- `dot(x, y)`, `cross(x, y)`
- `normalize(v)`
- `reflect(I, N)`, `refract(I, N, eta)`
- `faceforward(N, I, Nref)`

### Vector/Matrix
- `matrixCompMult(x, y)`
- `transpose(m)` - GLSL ES 3.00
- `inverse(m)` - GLSL ES 3.00

### Texture Lookup
- `texture2D(sampler, coord)` - GLSL ES 1.00
- `texture(sampler, coord)` - GLSL ES 3.00
- `textureCube(sampler, coord)`
- `texelFetch(sampler, coord, lod)` - GLSL ES 3.00

### Derivatives (fragment shader only)
- `dFdx(p)`, `dFdy(p)`, `fwidth(p)`

## Extension Compatibility

### Widely Supported (>90%)
- `ANGLE_instanced_arrays` - Instanced rendering (WebGL 1)
- `EXT_blend_minmax` - Min/max blend equations
- `EXT_texture_filter_anisotropic` - Anisotropic filtering
- `OES_element_index_uint` - 32-bit indices
- `OES_standard_derivatives` - Fragment shader derivatives
- `OES_vertex_array_object` - Vertex Array Objects (WebGL 1)
- `WEBGL_depth_texture` - Depth textures
- `WEBGL_lose_context` - Context loss simulation

### Common (60-90%)
- `EXT_frag_depth` - Fragment depth writing
- `EXT_shader_texture_lod` - Texture LOD in shaders
- `EXT_sRGB` - sRGB framebuffers
- `OES_texture_float` - Float textures
- `OES_texture_half_float` - Half-float textures
- `WEBGL_compressed_texture_s3tc` - DXT compression
- `WEBGL_draw_buffers` - Multiple render targets (WebGL 1)

### Less Common (<60%)
- `WEBGL_compressed_texture_astc` - ASTC compression
- `WEBGL_compressed_texture_etc` - ETC compression
- `WEBGL_compressed_texture_pvrtc` - PVRTC compression
- `EXT_color_buffer_float` - Float color buffers
- `EXT_disjoint_timer_query` - GPU timing queries
- `OVR_multiview2` - VR multi-view rendering

### Vendor-Specific
- `WEBGL_debug_renderer_info` - GPU vendor/renderer info
- `WEBGL_debug_shaders` - Translated shader source
- `WEBKIT_WEBGL_depth_texture` - Safari-specific

## WebGL 2 New Features

### Core Features (no extension needed)
- Vertex Array Objects (VAO)
- Instanced rendering
- Multiple render targets
- Transform feedback
- Sampler objects
- 3D textures
- 2D texture arrays
- Occlusion queries
- Uniform buffer objects
- Integer textures/attributes
- Non-power-of-2 texture support

### New GLSL Features
- Texture arrays
- Integer types (int, uint, ivec, uvec)
- Bit operations
- Flat/smooth interpolation
- centroid sampling
- Fragment depth control
- Multiple fragment outputs

### New Methods
- `gl.getBufferSubData()`
- `gl.blitFramebuffer()`
- `gl.invalidateFramebuffer()`
- `gl.readBuffer()`
- `gl.getFragDataLocation()`
- `gl.uniform[1234][ui]v()`
- `gl.uniformMatrix[234]x[234]fv()`
- `gl.clearBuffer[fiuv]()`
- `gl.getIndexedParameter()`
- `gl.copyBufferSubData()`

## Performance Benchmarks

### Typical Performance Targets
- **60 FPS** - 16.67ms per frame
- **30 FPS** - 33.33ms per frame

### Draw Call Budget (60 FPS)
- **Desktop** - ~1000-5000 draw calls
- **Mobile** - ~100-500 draw calls
- **Low-end Mobile** - ~50-100 draw calls

### Texture Size Limits
- **WebGL 1 minimum** - 2048x2048
- **WebGL 2 minimum** - 2048x2048
- **Typical desktop** - 8192x8192 to 16384x16384
- **Typical mobile** - 4096x4096 to 8192x8192

### Vertex/Fragment Shader Limits (minimums)
- **Vertex attributes** - 8 (WebGL 1), 16 (WebGL 2)
- **Vertex uniform vectors** - 128
- **Fragment uniform vectors** - 16 (WebGL 1), 224 (WebGL 2)
- **Varying vectors** - 8 (WebGL 1), 15 (WebGL 2)
- **Texture units** - 8 vertex + 8 fragment

Query actual limits:
```javascript
gl.getParameter(gl.MAX_TEXTURE_SIZE)
gl.getParameter(gl.MAX_VERTEX_ATTRIBS)
gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS)
gl.getParameter(gl.MAX_VARYING_VECTORS)
gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS)
gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS)
```
