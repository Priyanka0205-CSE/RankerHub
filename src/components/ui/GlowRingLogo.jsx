import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export const GlowRingLogo = ({ logoSrc, type = "logo", className = "" }) => {
  const containerRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const isHoveredRef = useRef(false);

  // Sync state to ref to avoid stale closures in the Three.js loop
  useEffect(() => {
    isHoveredRef.current = isHovered;
  }, [isHovered]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // --- Scene, Camera, Renderer ---
    const scene = new THREE.Scene();
    
    // Orthographic Camera covering exactly [-1.0, 1.0] in coordinate space
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;

    // WebGLRenderer with alpha enabled and antialiased rendering
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0); // Transparent black clear
    container.appendChild(renderer.domElement);

    // --- Ring Shader Material with Built-in Bloom Glow ---
    const RingShaderMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(200, 200) },
        uHover: { value: 0.0 }
      },
      transparent: true,
      blending: THREE.AdditiveBlending, // Additive blending for realistic glowing light
      side: THREE.DoubleSide,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform float uTime;
        uniform float uHover;
        
        #define PI 3.14159265359

        // Curated premium developer color generator (violet -> indigo -> blue -> magenta)
        vec3 getThemeColor(float w) {
          vec3 violet = vec3(0.55, 0.2, 0.9);
          vec3 indigo = vec3(0.25, 0.15, 0.85);
          vec3 blue   = vec3(0.1, 0.45, 0.95);
          vec3 magenta = vec3(0.9, 0.15, 0.6);
          
          float w4 = w * 4.0;
          if (w4 < 1.0) {
            return mix(violet, indigo, fract(w4));
          } else if (w4 < 2.0) {
            return mix(indigo, blue, fract(w4));
          } else if (w4 < 3.0) {
            return mix(blue, magenta, fract(w4));
          } else {
            return mix(magenta, violet, fract(w4));
          }
        }

        void main() {
          vec2 uv = vUv - 0.5;
          float dist = length(uv);
          
          // Base parameters that respond to hover state
          float baseRadius = 0.385;
          float baseGlowWidth = 0.085;
          float baseThickness = 0.015;

          // Align precisely outside the logo coin, expanding slightly on hover
          float radius = baseRadius + uHover * 0.015;
          float thickness = baseThickness;
          float distToRing = abs(dist - radius);
          
          // Gaussian smooth glow distribution, expanding on hover
          float glowWidth = baseGlowWidth + uHover * 0.025;
          float glow = exp(-pow(distToRing / glowWidth, 2.0));
          
          // Sharp core ring
          float sharpRing = smoothstep(thickness, thickness - 0.004, distToRing);
          
          // Discard pixels with virtually zero glow or ring to avoid square bounding box
          if (sharpRing < 0.001 && glow < 0.001) discard;

          // Rotation angle for flares
          float angle = atan(uv.y, uv.x) + PI;
          
          // Sweeping animations (counter-rotating waves, speed up on hover)
          float speedMultiplier = 1.0 + uHover * 1.2;
          float sweep1 = sin(angle - uTime * 1.5 * speedMultiplier) * 0.5 + 0.5;
          float sweep2 = cos(angle * 2.0 + uTime * 0.8 * speedMultiplier) * 0.3 + 0.7;
          float flare = pow(sweep1 * sweep2, 2.5) * 1.8;

          // Smooth color wheel rotation + minor radial dispersion (prevents banding)
          float colorShift = angle / (2.0 * PI) + uTime * 0.05;
          float radialShift = (dist - radius) * 0.4;
          vec3 baseColor = getThemeColor(mod(colorShift + radialShift, 1.0));

          // Dynamic gold flare beams matching the logo's crown
          float beamIntensity = smoothstep(0.97, 1.0, sin(angle - uTime * 2.5 * speedMultiplier));
          vec3 beamColor = vec3(1.0, 0.85, 0.5) * beamIntensity * 4.0;
          
          // Compose final colors
          vec3 ringColor = baseColor * (sharpRing * (2.5 + uHover * 1.0) + flare * (1.8 + uHover * 1.0)) + beamColor * sharpRing;
          vec3 glowColor = baseColor * glow * ((1.6 + uHover * 1.4) + flare * (0.8 + uHover * 0.8)) + vec3(1.0, 0.85, 0.6) * glow * beamIntensity * 1.5;
          vec3 finalColor = ringColor + glowColor;
          
          // Outer bloom alpha gradient
          float alpha = max(sharpRing, glow * (0.85 + uHover * 0.15));
          
          // Output color and alpha
          gl_FragColor = vec4(finalColor, alpha);
        }
      `
    });

    // 2x2 geometry matches orthographic bounds [-1, 1] exactly!
    const quadGeo = new THREE.PlaneGeometry(2, 2);
    const ringMesh = new THREE.Mesh(quadGeo, RingShaderMaterial);
    scene.add(ringMesh);

    // --- Animation Loop ---
    const clock = new THREE.Clock();
    let animationFrameId;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Dynamically verify and update size on each frame to solve mount/layout timing issues
      const w = container.clientWidth || container.parentElement?.clientWidth || 200;
      const h = container.clientHeight || container.parentElement?.clientHeight || 200;
      
      if (renderer.domElement.width !== w * window.devicePixelRatio || renderer.domElement.height !== h * window.devicePixelRatio) {
        renderer.setSize(w, h);
        RingShaderMaterial.uniforms.uResolution.value.set(w, h);
      }

      // Smoothly animate the hover uniform value
      const targetHover = isHoveredRef.current ? 1.0 : 0.0;
      RingShaderMaterial.uniforms.uHover.value = THREE.MathUtils.lerp(
        RingShaderMaterial.uniforms.uHover.value,
        targetHover,
        0.1
      );

      RingShaderMaterial.uniforms.uTime.value = clock.getElapsedTime();
      renderer.render(scene, camera);
    };

    animate();

    // --- Cleanup ---
    return () => {
      cancelAnimationFrame(animationFrameId);

      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }

      quadGeo.dispose();
      RingShaderMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  // Hybrid Layout: HTML/CSS for the logo, WebGL Canvas in background for the bloom ring
  return (
    <div 
      className={`relative flex items-center justify-center select-none rounded-full transition-all duration-500 ease-out cursor-pointer ${
        isHovered 
          ? "shadow-[0_30px_70px_rgba(0,0,0,0.75)] scale-110 -translate-y-2" 
          : "shadow-[0_20px_50px_rgba(0,0,0,0.55)] scale-100 translate-y-0"
      } ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 3D WebGL Canvas for the glowing/blooming shader ring */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full pointer-events-none z-0 scale-[1.15]" />
      
      {/* Clean native logo wrapper with slight parallax scale on hover */}
      <div 
        className={`relative w-[80%] h-[80%] rounded-full overflow-hidden flex items-center justify-center z-10 transition-transform duration-500 ease-out ${
          isHovered ? "scale-105" : "scale-100"
        }`}
      >
        {/* Render actual image logo (or custom home icon geometry placeholder) */}
        {type === "home" ? (
          <div className="w-1/2 h-1/2 flex items-center justify-center text-slate-300 z-10">
            {/* Simple SVG Home Icon matching the 3D home extrusion */}
            <svg viewBox="0 0 24 24" className="w-full h-full fill-current" stroke="currentColor" strokeWidth="1">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
            </svg>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center z-10">
            <img 
              src={logoSrc} 
              alt="Logo" 
              className="w-full h-full object-cover rounded-full" 
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default GlowRingLogo;
