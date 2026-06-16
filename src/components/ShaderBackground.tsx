import React, { useEffect, useRef } from 'react';
import { useAppTheme } from '../contexts/ThemeContext';

export const ShaderBackground: React.FC = () => {
  const { theme, mode } = useAppTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext;
    if (!gl) return;

    let animationFrameId: number;

    const vs = `
      attribute vec2 a_position;
      varying vec2 v_texCoord;
      void main() {
        v_texCoord = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    const forgeFs = `
      precision highp float;
      varying vec2 v_texCoord;
      uniform float u_time;
      
      float noise(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
      }

      void main() {
        vec2 uv = v_texCoord;
        vec3 color = ${mode === 'light' ? 'vec3(0.97, 0.98, 0.99)' : 'vec3(0.02, 0.024, 0.027)'};
        
        // Slow diagonal light sweep
        float sweep = sin(uv.x * 1.5 + uv.y * 0.8 - u_time * 0.1) * 0.5 + 0.5;
        sweep = pow(sweep, 4.0);
        color += vec3(0.96, 0.62, 0.04) * sweep * 0.015;
        
        // Subtle grid glow points
        vec2 grid = fract(uv * 12.0);
        float dot_point = smoothstep(0.48, 0.5, max(abs(grid.x - 0.5), abs(grid.y - 0.5)));
        float gridPulse = sin(u_time * 0.3 + uv.x * 3.0 + uv.y * 2.0) * 0.5 + 0.5;
        color += vec3(0.96, 0.62, 0.04) * (1.0 - dot_point) * ${mode === 'light' ? '0.005' : '0.01'} * gridPulse;
        
        // Upward drifting embers (dimmed in light mode)
        vec2 emberUv = uv;
        emberUv.y += u_time * 0.05;
        emberUv.x += sin(u_time * 0.2 + emberUv.y * 5.0) * 0.02;
        float ember = pow(noise(emberUv * 60.0), 40.0);
        float emberFlicker = sin(u_time * 5.0 + noise(uv)*10.0) * 0.5 + 0.5;
        color += ${mode === 'light' ? 'vec3(0.96, 0.62, 0.04) * ember * 0.4' : 'vec3(1.0, 0.5, 0.0) * ember * 1.5'} * emberFlicker;
        
        // Vignette
        float vig = 1.0 - length((uv - 0.5) * 1.3);
        color *= ${mode === 'light' ? '1.0' : 'smoothstep(0.0, 0.7, vig)'};
        
        gl_FragColor = vec4(color, 1.0);
      }
    `;

    const ascendFs = `
      precision highp float;
      varying vec2 v_texCoord;
      uniform float u_time;

      float noise(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
      }

      void main() {
        vec2 uv = v_texCoord;
        vec3 color = ${mode === 'light' ? 'vec3(0.97, 0.98, 1.0)' : 'vec3(0.015, 0.01, 0.04)'};
        
        // Deep nebula layers
        float g1 = sin(uv.x * 2.0 + u_time * 0.06) * 0.5 + 0.5;
        g1 *= cos(uv.y * 2.5 - u_time * 0.04) * 0.5 + 0.5;
        
        float g2 = cos(uv.x * 1.5 - u_time * 0.05 + 1.5) * 0.5 + 0.5;
        g2 *= sin(uv.y * 2.0 + u_time * 0.03 + 0.8) * 0.5 + 0.5;
        
        float g3 = sin(uv.x * 3.0 - uv.y * 2.0 + u_time * 0.02) * 0.5 + 0.5;

        vec3 purple = ${mode === 'light' ? 'vec3(0.8, 0.7, 0.95)' : 'vec3(0.4, 0.1, 0.8)'};
        vec3 cyan = ${mode === 'light' ? 'vec3(0.7, 0.9, 0.95)' : 'vec3(0.1, 0.7, 0.9)'};
        vec3 deepBlue = ${mode === 'light' ? 'vec3(0.8, 0.9, 0.98)' : 'vec3(0.0, 0.1, 0.3)'};
        
        color += purple * pow(g1, 2.0) * ${mode === 'light' ? '0.04' : '0.12'};
        color += cyan * pow(g2, 2.0) * ${mode === 'light' ? '0.02' : '0.06'};
        color += deepBlue * pow(g3, 2.0) * ${mode === 'light' ? '0.02' : '0.08'};
        
        // Parallax star field (dimmed in light mode)
        float stars1 = pow(noise(uv * 150.0 + floor(u_time * 0.01)), 25.0);
        float stars2 = pow(noise(uv * 250.0 - floor(u_time * 0.015)), 28.0);
        
        color += vec3(0.8, 0.85, 1.0) * stars1 * ${mode === 'light' ? '0.08' : '0.4'};
        color += vec3(0.6, 0.7, 1.0) * stars2 * ${mode === 'light' ? '0.04' : '0.2'};
        
        // Vignette
        float vig = 1.0 - length((uv - 0.5) * 1.4);
        color *= ${mode === 'light' ? '1.0' : 'smoothstep(0.0, 0.8, vig)'};
        
        gl_FragColor = vec4(color, 1.0);
      }
    `;

    const fs = theme === 'FORGE' ? forgeFs : ascendFs;

    function compileShader(gl: WebGLRenderingContext, source: string, type: number): WebGLShader | null {
      const s = gl.createShader(type);
      if (!s) return null;
      gl.shaderSource(s, source);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(s));
        gl.deleteShader(s);
        return null;
      }
      return s;
    }

    const prog = gl.createProgram();
    if (!prog) return;

    const vertexShader = compileShader(gl, vs, gl.VERTEX_SHADER);
    const fragmentShader = compileShader(gl, fs, gl.FRAGMENT_SHADER);
    if (!vertexShader || !fragmentShader) return;

    gl.attachShader(prog, vertexShader);
    gl.attachShader(prog, fragmentShader);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(prog));
      return;
    }

    gl.useProgram(prog);
    const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    const pos = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
    const uTime = gl.getUniformLocation(prog, 'u_time');

    function syncSize() {
      if (!canvas || !gl) return;
      const w = canvas.clientWidth || 1280;
      const h = canvas.clientHeight || 720;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    }

    syncSize();
    let resizeObserver: ResizeObserver | undefined;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => syncSize());
      resizeObserver.observe(canvas);
    }

    function render(t: number) {
      if (!gl) return;
      if (uTime) gl.uniform1f(uTime, t * 0.001);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animationFrameId = requestAnimationFrame(render);
    }
    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (resizeObserver) resizeObserver.disconnect();
      if (gl) {
        gl.deleteProgram(prog);
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        gl.deleteBuffer(buf);
      }
    };
  }, [theme, mode]);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none opacity-60 transition-opacity duration-1000">
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};
