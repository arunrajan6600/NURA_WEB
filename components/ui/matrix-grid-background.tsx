"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

interface MatrixGridBackgroundProps {
  className?: string;
  enableWaveAnimation?: boolean;
  enableMouseHoverAnimation?: boolean;
  enableCardBorderAnimation?: boolean;
}

export default function MatrixGridBackground({
  className = "",
  enableWaveAnimation = true,
  enableMouseHoverAnimation = true,
  enableCardBorderAnimation = true,
}: MatrixGridBackgroundProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [hoveredCardBounds, setHoveredCardBounds] = useState<{
    left: number;
    top: number;
    right: number;
    bottom: number;
    width: number;
    height: number;
    cardId: string;
  } | null>(null);

  // Listen for mouse movement
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: e.clientX,
        y: e.clientY,
      });
    };

    const handleCardHover = (e: CustomEvent) => {
      if (e.detail.type === "enter" || e.detail.type === "update") {
        setHoveredCardBounds({
          ...e.detail.bounds,
          cardId: e.detail.cardId,
        });
      } else if (e.detail.type === "leave") {
        // Only clear if it's the same card that's leaving
        setHoveredCardBounds((prev) => {
          if (prev && (!e.detail.cardId || prev.cardId === e.detail.cardId)) {
            return null;
          }
          return prev;
        });
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("cardHover", handleCardHover as EventListener);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("cardHover", handleCardHover as EventListener);
    };
  }, []);

  return (
    <div
      className={`pointer-events-none ${className}`}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: -1,
      }}
    >
      <Canvas
        gl={{
          antialias: true,
          powerPreference: "high-performance",
          alpha: true,
        }}
        dpr={[1, 1.5]}
        className="w-full h-full"
        style={{ width: "100%", height: "100%" }}
      >
        <color attach="background" args={["transparent"]} />
        <MatrixShader
          mousePosition={mousePosition}
          hoveredCardBounds={hoveredCardBounds}
          enableWaveAnimation={enableWaveAnimation}
          enableMouseHoverAnimation={enableMouseHoverAnimation}
          enableCardBorderAnimation={enableCardBorderAnimation}
        />
      </Canvas>
    </div>
  );
}

function MatrixShader({
  mousePosition,
  hoveredCardBounds,
  enableWaveAnimation,
  enableMouseHoverAnimation,
  enableCardBorderAnimation,
}: {
  mousePosition: { x: number; y: number };
  hoveredCardBounds: {
    left: number;
    top: number;
    right: number;
    bottom: number;
    width: number;
    height: number;
  } | null;
  enableWaveAnimation: boolean;
  enableMouseHoverAnimation: boolean;
  enableCardBorderAnimation: boolean;
}) {
  const { viewport, size, camera } = useThree();
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const time = useRef(0);
  const lastHoveredCell = useRef({ x: -1, y: -1 });
  const raycaster = useRef(new THREE.Raycaster());
  const mouse3D = useRef(new THREE.Vector2());
  const hoverEndTime = useRef(-1); // Time when hover ended
  const hoverDelay = 1.2; // Delay in seconds before glow fades out

  // Update shader uniforms on each frame
  useFrame((_, delta) => {
    if (!materialRef.current || !meshRef.current) return;

    time.current += delta;

    // Update uniforms
    materialRef.current.uniforms.u_time.value = time.current;
    materialRef.current.uniforms.u_resolution.value.set(
      size.width,
      size.height
    );

    // Update animation control uniforms
    materialRef.current.uniforms.u_enableWaveAnimation.value =
      enableWaveAnimation ? 1.0 : 0.0;
    materialRef.current.uniforms.u_enableMouseHoverAnimation.value =
      enableMouseHoverAnimation ? 1.0 : 0.0;
    materialRef.current.uniforms.u_enableCardBorderAnimation.value =
      enableCardBorderAnimation ? 1.0 : 0.0;

    // Update card bounds uniform
    if (hoveredCardBounds) {
      // Get current scroll position
      const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
      const scrollY = window.pageYOffset || document.documentElement.scrollTop;

      // Convert absolute document coordinates to viewport coordinates
      const viewportLeft = hoveredCardBounds.left - scrollX;
      const viewportTop = hoveredCardBounds.top - scrollY;
      const viewportRight = hoveredCardBounds.right - scrollX;
      const viewportBottom = hoveredCardBounds.bottom - scrollY;

      // Check if card is actually visible in viewport
      const isVisible =
        viewportRight > 0 &&
        viewportLeft < size.width &&
        viewportBottom > 0 &&
        viewportTop < size.height;

      if (isVisible) {
        // Normalize to 0-1 range for shader (with Y inverted for WebGL)
        const normalizedLeft = Math.max(0, viewportLeft / size.width);
        const normalizedRight = Math.min(1, viewportRight / size.width);
        const normalizedTop = Math.max(0, 1.0 - viewportBottom / size.height);
        const normalizedBottom = Math.min(1, 1.0 - viewportTop / size.height);

        materialRef.current.uniforms.u_cardBounds.value.set(
          normalizedLeft,
          normalizedTop,
          normalizedRight,
          normalizedBottom
        );
        materialRef.current.uniforms.u_hasHoveredCard.value = 1.0;
      } else {
        materialRef.current.uniforms.u_hasHoveredCard.value = 0.0;
      }
    } else {
      materialRef.current.uniforms.u_hasHoveredCard.value = 0.0;
    }

    // Calculate time since hover ended (for fade-out effect)
    const timeSinceHoverEnded =
      hoverEndTime.current >= 0 ? time.current - hoverEndTime.current : -1;
    materialRef.current.uniforms.u_hoverEndTime.value = timeSinceHoverEnded;
    materialRef.current.uniforms.u_hoverDelay.value = hoverDelay;

    // Always update hover state based on global mouse position
    // Convert mouse position to normalized device coordinates (-1 to +1)
    mouse3D.current.x = (mousePosition.x / size.width) * 2 - 1;
    mouse3D.current.y = -(mousePosition.y / size.height) * 2 + 1;

    // Set up raycaster
    raycaster.current.setFromCamera(mouse3D.current, camera);

    // Perform raycasting
    const intersects = raycaster.current.intersectObject(meshRef.current);

    if (intersects.length > 0) {
      // Get intersection point in UV coordinates
      const uv = intersects[0].uv;

      // Get grid size from uniforms
      const gridSize = materialRef.current.uniforms.u_gridSize.value;

      // Calculate aspect ratio to maintain square cells
      const aspectRatio = size.width / size.height;
      const adjustedGridSize = new THREE.Vector2(gridSize.x, gridSize.y);

      if (aspectRatio > 1.0) {
        // Landscape orientation
        adjustedGridSize.x = Math.floor(gridSize.y * aspectRatio);
      } else {
        // Portrait orientation
        adjustedGridSize.y = Math.floor(gridSize.x / aspectRatio);
      }

      // Calculate which cell is being hovered using the UV coordinates
      const cellX = Math.floor(uv!.x * adjustedGridSize.x);
      const cellY = Math.floor(uv!.y * adjustedGridSize.y);

      // Only update if the hovered cell has changed
      if (
        cellX !== lastHoveredCell.current.x ||
        cellY !== lastHoveredCell.current.y
      ) {
        materialRef.current.uniforms.u_hoveredCell.value.set(cellX, cellY);
        lastHoveredCell.current = { x: cellX, y: cellY };
      }
    }
  });

  // Create shader material
  const shaderMaterial = new THREE.ShaderMaterial({
    vertexShader: `
      varying vec2 vUv;
      
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform vec2 u_mouse;
      uniform vec2 u_gridSize;
      uniform vec2 u_hoveredCell;
      uniform float u_hoverEndTime;
      uniform float u_hoverDelay;
      uniform float u_headerHeight;
      uniform vec4 u_cardBounds;
      uniform float u_hasHoveredCard;
      uniform float u_enableWaveAnimation;
      uniform float u_enableMouseHoverAnimation;
      uniform float u_enableCardBorderAnimation;
      
      varying vec2 vUv;
      
      // Function to draw a square with border
      float drawSquareBorder(vec2 st, vec2 size, float thickness) {
        // Calculate distance to the closest edge
        vec2 bottomLeft = step(vec2(thickness), st);
        vec2 topRight = step(vec2(thickness), size - st);
        
        // Combine edges
        float outline = 1.0 - (bottomLeft.x * bottomLeft.y * topRight.x * topRight.y);
        
        // Create the inner square (hollow center)
        vec2 innerBottomLeft = step(vec2(thickness * 2.0), st);
        vec2 innerTopRight = step(vec2(thickness * 2.0), size - st);
        float innerSquare = innerBottomLeft.x * innerBottomLeft.y * innerTopRight.x * innerTopRight.y;
        
        // Combine to get wireframe
        return outline - innerSquare;
      }
      
      // Function to draw a filled square
      float drawSquareFilled(vec2 st, vec2 size, float padding) {
        // Calculate distance to the closest edge with padding
        vec2 bottomLeft = step(vec2(padding), st);
        vec2 topRight = step(vec2(padding), size - st);
        
        // Combine edges to get filled square
        return bottomLeft.x * bottomLeft.y * topRight.x * topRight.y;
      }
      
      // Function to calculate distance between two cells
      float cellDistance(vec2 cell1, vec2 cell2) {
        return length(cell1 - cell2);
      }
      
      // Function to create a bloom effect
      vec3 applyBloom(vec3 color, float intensity) {
        return color * intensity;
      }
      
      // Function to create animated bleeding borders from top
      float animatedBorderBleeding(vec2 cellIndex, float time, vec2 adjustedGridSize) {
        // Invert Y coordinate so effect comes from top (0 = top, max = bottom)
        float invertedY = adjustedGridSize.y - cellIndex.y;
        
        // Calculate wave that travels from top to bottom
        float wave = sin(time * 2.0 - invertedY * 0.5) * 0.5 + 0.5;
        
        // Create multiple overlapping waves for more complexity
        float wave2 = sin(time * 1.5 - invertedY * 0.3 + cellIndex.x * 0.1) * 0.5 + 0.5;
        float wave3 = sin(time * 3.0 - invertedY * 0.8 + cellIndex.x * 0.05) * 0.5 + 0.5;
        
        // Combine waves
        float combinedWave = (wave + wave2 * 0.7 + wave3 * 0.5) / 2.2;
        
        // Make it more prominent at the top (smaller invertedY values)
        float topIntensity = 1.0 - smoothstep(0.0, 10.0, invertedY);
        
        return combinedWave * topIntensity;
      }
      
      // Function to calculate fade based on header position
      float calculateHeaderFade(vec2 screenPos, vec2 resolution, float headerHeight) {
        // Convert to screen pixels from top (invert Y coordinate)
        float pixelY = (1.0 - screenPos.y) * resolution.y;
        
        // Fade out in the header area with smooth transition
        float fadeStart = headerHeight * 0.5;
        float fadeEnd = headerHeight * 1.5;
        
        return smoothstep(fadeStart, fadeEnd, pixelY);
      }
      
      // Function to create card border glow effect
      float calculateCardBorderEffect(vec2 screenPos, vec4 cardBounds, float time) {
        // cardBounds: x=left, y=bottom, z=right, w=top (in normalized coords with Y inverted)
        vec2 cardCenter = vec2((cardBounds.x + cardBounds.z) * 0.5, (cardBounds.y + cardBounds.w) * 0.5);
        vec2 cardSize = vec2(cardBounds.z - cardBounds.x, cardBounds.w - cardBounds.y);
        
        // Distance from current position to card bounds
        vec2 distToCard = abs(screenPos - cardCenter) - cardSize * 0.5;
        float distFromEdge = length(max(distToCard, 0.0)) + min(max(distToCard.x, distToCard.y), 0.0);
        
        // Create very subtle glow effect around the card
        float borderWidth = 0.03; // Much smaller width for subtlety
        float glowIntensity = 1.0 - smoothstep(0.0, borderWidth, abs(distFromEdge));
        
        // Very gentle pulsating animation
        glowIntensity *= 0.8 + 0.2 * sin(time * 2.0);
        
        // Subtle edge proximity effect
        float edgeProximity = 1.0 - smoothstep(0.0, borderWidth * 0.4, abs(distFromEdge));
        glowIntensity += edgeProximity * 0.3;
        
        return glowIntensity * 0.5; // Overall intensity reduction
      }
      
      void main() {
        // Calculate aspect ratio to maintain square cells
        float aspectRatio = u_resolution.x / u_resolution.y;
        
        // Determine the number of cells that fit in each dimension
        // We'll keep the y-dimension fixed and adjust x based on aspect ratio
        vec2 adjustedGridSize = u_gridSize;
        
        // Adjust grid size to maintain square cells
        if (aspectRatio > 1.0) {
          // Landscape orientation
          adjustedGridSize.x = floor(u_gridSize.y * aspectRatio);
        } else {
          // Portrait orientation
          adjustedGridSize.y = floor(u_gridSize.x / aspectRatio);
        }
        
        // Scale UV coordinates to grid size
        vec2 st = vUv * adjustedGridSize;
        
        // Get the integer and fractional parts of the coordinates
        vec2 cellIndex = floor(st);
        vec2 cellUv = fract(st);
        
        // Draw wireframe square border (made even thinner for smaller squares)
        float thickness = 0.008; // Reduced thickness for smaller squares
        float padding = 0.015;   // Reduced padding for the filled square
        float squareBorder = drawSquareBorder(cellUv, vec2(1.0), thickness);
        float squareFilled = drawSquareFilled(cellUv, vec2(1.0), padding);
        
        // Calculate header fade effect
        float headerFade = calculateHeaderFade(vUv, u_resolution, u_headerHeight);
        
        // Calculate animated bleeding borders from top (conditional)
        float bleedingBorder = 0.0;
        if (u_enableWaveAnimation > 0.5) {
          bleedingBorder = animatedBorderBleeding(cellIndex, u_time, adjustedGridSize);
        }
        
        // Calculate card border effect if a card is hovered (conditional)
        float cardBorderEffect = 0.0;
        if (u_enableCardBorderAnimation > 0.5 && u_hasHoveredCard > 0.5) {
          cardBorderEffect = calculateCardBorderEffect(vUv, u_cardBounds, u_time);
        }
        
        // Base color for all squares (subtle grayscale with conditional bleeding effect)
        vec3 baseColor = vec3(0.08) * squareBorder;
        vec3 bleedingColor = vec3(0.15 + bleedingBorder * 0.3) * squareBorder;
        
        // Blend base and bleeding colors, applying header fade (only if wave animation enabled)
        vec3 color = baseColor * headerFade;
        if (u_enableWaveAnimation > 0.5) {
          color = mix(baseColor, bleedingColor, bleedingBorder) * headerFade;
        }
        
        // Calculate which cell is being hovered
        vec2 currentCell = cellIndex;
        
        // Calculate distance to hovered cell
        float dist = cellDistance(currentCell, u_hoveredCell);
        
        // Check if any cell is being hovered (u_hoveredCell is initialized to -1,-1)
        bool isAnyHovered = u_hoveredCell.x >= 0.0 && u_hoveredCell.y >= 0.0;
        
        // Calculate fade factor based on hover end time
        float fadeFactor = 1.0;
        if (u_hoverEndTime > 0.0) {
          // Gradually fade out after hover delay
          fadeFactor = 1.0 - smoothstep(0.0, u_hoverDelay, u_hoverEndTime);
        }
        
        // RGB glow effect for hovered and nearby cells (conditional)
        if (u_enableMouseHoverAnimation > 0.5 && isAnyHovered && dist < 4.0) {
          // Calculate glow intensity based on distance
          float glowIntensity = 1.0 - (dist / 4.0);
          glowIntensity = pow(glowIntensity, 1.5); // Adjusted falloff for more spread
          
          // Apply fade factor to glow intensity
          glowIntensity *= fadeFactor * headerFade;
          
          // Pulsating effect
          glowIntensity *= 0.8 + 0.2 * sin(u_time * 3.0);
          
          // Grayscale glow with subtle variation
          float baseIntensity = 0.7 + 0.3 * sin(u_time * 0.5 + (currentCell.x + currentCell.y) * 0.1);
          vec3 glowColor = vec3(baseIntensity, baseIntensity, baseIntensity);
          
          // For the hovered cell, fill the entire box with glow
          if (dist < 0.1) {
            // Fill the box with bright color
            color = mix(color, glowColor * squareFilled * 1.2, glowIntensity);
            // Add border on top
            color += glowColor * squareBorder * 0.8 * glowIntensity;
            
            // Add intense bloom effect for hovered cell
            vec3 bloom = applyBloom(glowColor, 2.0 * glowIntensity) * squareFilled;
            color += bloom;
          } 
          // For nearby cells, add glow based on distance
          else {
            // Add glow to the fill based on distance
            color += glowColor * squareFilled * glowIntensity * 0.8;
            // Add glow to the border
            color += glowColor * squareBorder * glowIntensity * 0.6;
            
            // Add bloom effect that extends beyond the cell boundaries
            float bloomRadius = 0.5 * glowIntensity;
            vec3 bloom = applyBloom(glowColor, bloomRadius);
            color += bloom * 0.4 * squareFilled;
          }
          
          // Add outer glow that extends beyond cell boundaries
          float outerGlow = glowIntensity * 0.3;
          color += glowColor * outerGlow;
        }
        
        // Add subtle ambient glow to all cells (respecting header fade)
        float ambientPulse = 0.02 + 0.02 * sin(u_time + cellIndex.x * 0.2 + cellIndex.y * 0.3);
        color += vec3(0.03, 0.03, 0.03) * squareBorder * ambientPulse * headerFade;
        
        // Add extra bleeding effect intensity at the top (conditional)
        if (u_enableWaveAnimation > 0.5) {
          color += vec3(0.05, 0.05, 0.05) * squareBorder * bleedingBorder * headerFade;
        }
        
        // Add card border glow effect (conditional)
        if (u_enableCardBorderAnimation > 0.5 && u_hasHoveredCard > 0.5 && cardBorderEffect > 0.1) {
          vec3 cardGlowColor = vec3(0.6, 0.6, 0.65); // Very subtle blue-tinted white
          color += cardGlowColor * cardBorderEffect * 0.15 * squareBorder * headerFade;
          color += cardGlowColor * cardBorderEffect * 0.08 * squareFilled * headerFade;
        }
        
        gl_FragColor = vec4(color, 0.9 * headerFade);
      }
    `,
    uniforms: {
      u_time: { value: 0 },
      u_resolution: { value: new THREE.Vector2() },
      u_mouse: { value: new THREE.Vector2(0.5, 0.5) },
      u_gridSize: { value: new THREE.Vector2(20, 20) }, // Smaller squares - increased grid size
      u_hoveredCell: { value: new THREE.Vector2(-1, -1) }, // Currently hovered cell
      u_hoverEndTime: { value: -1 }, // Time since hover ended (-1 means still hovering)
      u_hoverDelay: { value: 1.2 }, // Delay in seconds before glow fades out
      u_headerHeight: { value: 64 }, // Header height in pixels (16 * 4 = 64px)
      u_cardBounds: { value: new THREE.Vector4(0, 0, 0, 0) }, // left, top, right, bottom (normalized)
      u_hasHoveredCard: { value: 0.0 }, // 1.0 if a card is hovered, 0.0 otherwise
      u_enableWaveAnimation: { value: enableWaveAnimation ? 1.0 : 0.0 }, // Toggle wave animation
      u_enableMouseHoverAnimation: {
        value: enableMouseHoverAnimation ? 1.0 : 0.0,
      }, // Toggle mouse hover effects
      u_enableCardBorderAnimation: {
        value: enableCardBorderAnimation ? 1.0 : 0.0,
      }, // Toggle card border effects
    },
  });

  return (
    <mesh ref={meshRef} scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <primitive object={shaderMaterial} ref={materialRef} attach="material" />
    </mesh>
  );
}
