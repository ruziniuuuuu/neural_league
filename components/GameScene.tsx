import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Text } from '@react-three/drei';
import * as THREE from 'three';
import { GameState, Player } from '../types';
import { ENV_CONFIG, FIELD_WIDTH, FIELD_HEIGHT, TEAM_COLORS } from '../constants';

// Fix for TypeScript errors regarding missing IntrinsicElements for React Three Fiber
// We augment the global JSX namespace to ensure compatibility.
declare global {
  namespace JSX {
    interface IntrinsicElements {
      mesh: any;
      group: any;
      ringGeometry: any;
      circleGeometry: any;
      cylinderGeometry: any;
      sphereGeometry: any;
      planeGeometry: any;
      boxGeometry: any;
      meshBasicMaterial: any;
      meshStandardMaterial: any;
      ambientLight: any;
      hemisphereLight: any;
      directionalLight: any;
      color: any;
    }
  }
}

const P_OFFSET_X = -FIELD_WIDTH / 2;
const P_OFFSET_Z = -FIELD_HEIGHT / 2;

// --- Sub-Components ---

const KickIndicator: React.FC<{ type: 'pass' | 'shoot' | 'dribble' }> = ({ type }) => {
  const color = type === 'shoot' ? '#ef4444' : '#fbbf24'; // Red for shoot, Amber for pass
  const radius = type === 'shoot' ? 50 : 35;
  const arcAngle = type === 'shoot' ? Math.PI / 3 : Math.PI / 4;
  
  // Align arc to point towards +Z in World Space when rotation is 0.
  // The mesh is rotated -PI/2 on X, so its local Y- axis points to World +Z.
  // In RingGeometry, 0 is X+, PI/2 is Y+.
  // We want the arc centered at 3PI/2 (270 deg), which is local Y-.
  const thetaStart = (3 * Math.PI / 2) - (arcAngle / 2);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.5, 0]}>
      {/* Inner radius 15 clears the player body */}
      <ringGeometry args={[15, radius, 32, 1, thetaStart, arcAngle]} />
      <meshBasicMaterial color={color} transparent opacity={0.6} side={THREE.DoubleSide} />
    </mesh>
  );
};

const PlayerMesh: React.FC<{ player: Player; isPossessing: boolean }> = ({ player, isPossessing }) => {
  const meshRef = useRef<THREE.Group>(null);
  const actionRef = useRef<THREE.Group>(null);
  const colors = TEAM_COLORS[player.team];
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      // 1. Position
      meshRef.current.position.x = player.pos.x + P_OFFSET_X;
      meshRef.current.position.z = player.pos.y + P_OFFSET_Z;
      
      // 2. Body Tilt (Visual feedback for movement)
      const tiltX = Math.max(-0.5, Math.min(0.5, player.vel.y * 0.05));
      const tiltZ = Math.max(-0.5, Math.min(0.5, -player.vel.x * 0.05));
      
      meshRef.current.rotation.z = tiltZ;
      meshRef.current.rotation.x = tiltX;

      // 3. Pulse effect for possession ring
      if (isPossessing && ringRef.current) {
        const s = 1 + Math.sin(state.clock.elapsedTime * 10) * 0.1;
        ringRef.current.scale.set(s, s, s);
      }
    }

    // 4. Action Indicator Orientation
    if (actionRef.current) {
      const vx = player.vel.x;
      const vy = player.vel.y; 
      
      if (Math.abs(vx) > 0.1 || Math.abs(vy) > 0.1) {
         // Calculate angle from Z axis.
         // atan2(vx, vy) treats vy as X-coord and vx as Y-coord in calculation.
         // Maps (0, 1) -> 0. (Vector along +Z -> Angle 0).
         // This assumes the object at 0 rotation faces +Z.
         const angle = Math.atan2(vx, vy); 
         actionRef.current.rotation.y = angle; 
      }
    }
  });

  // Only show indicator for 'pass' or 'shoot'. 'dribble' is too frequent.
  const showAction = player.lastAction === 'pass' || player.lastAction === 'shoot';

  return (
    <group ref={meshRef}>
      {/* Possession Indicator */}
      {isPossessing && (
         <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.5, 0]}>
           <ringGeometry args={[player.radius + 2, player.radius + 5, 32]} />
           <meshBasicMaterial color="#fbbf24" opacity={0.6} transparent side={THREE.DoubleSide} />
         </mesh>
      )}

      {/* Shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.2, 0]}>
        <circleGeometry args={[player.radius, 32]} />
        <meshBasicMaterial color="black" opacity={0.3} transparent />
      </mesh>

      {/* Action Indicator (Minimalist Arc) */}
      <group ref={actionRef} position={[0, 1, 0]}>
         {showAction && player.lastAction && (
           <KickIndicator type={player.lastAction} />
         )}
      </group>

      {/* Body */}
      <mesh position={[0, 10, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[player.radius, player.radius, 20, 32]} />
        <meshStandardMaterial 
          color={colors?.primary || '#888888'} 
          emissive={colors?.secondary || '#000000'}
          emissiveIntensity={0.2}
          roughness={0.4}
          metalness={0.3}
        />
      </mesh>
      
      {/* Cap/Top Indicator */}
      <mesh position={[0, 20.1, 0]} rotation={[-Math.PI/2, 0, 0]}>
        <circleGeometry args={[player.radius * 0.8, 32]} />
        <meshBasicMaterial color="white" />
      </mesh>
      
      <Text 
        position={[0, 35, 0]} 
        fontSize={14} 
        color="white" 
        outlineWidth={1}
        outlineColor="black"
        anchorX="center" 
        anchorY="middle"
      >
        {player.id.toString()}
      </Text>
    </group>
  );
};

const BallMesh: React.FC<{ ball: GameState['ball'] }> = ({ ball }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.x = ball.pos.x + P_OFFSET_X;
      meshRef.current.position.z = ball.pos.y + P_OFFSET_Z;
      // Lift slightly to avoid z-fighting with field lines
      meshRef.current.position.y = ball.radius + 0.5; 
      
      meshRef.current.rotation.x += ball.vel.y * 0.1;
      meshRef.current.rotation.z -= ball.vel.x * 0.1;
    }
  });

  return (
    <mesh ref={meshRef} castShadow receiveShadow>
      <sphereGeometry args={[ball.radius, 32, 32]} />
      {/* Standard material for ball too */}
      <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.1} />
    </mesh>
  );
};

const FieldBase: React.FC = () => {
  return (
    <group rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <mesh position={[0, 0, -1]}>
        <planeGeometry args={[FIELD_WIDTH + 200, FIELD_HEIGHT + 200]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>

      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[FIELD_WIDTH, FIELD_HEIGHT]} />
        <meshStandardMaterial color="#064e3b" roughness={0.8} />
      </mesh>

      {/* Checkerboard Pattern */}
      {Array.from({ length: 16 }).map((_, i) => (
        <mesh key={i} position={[-FIELD_WIDTH/2 + i * 50 + 25, 0, 0.1]}>
          <planeGeometry args={[50, FIELD_HEIGHT]} />
          <meshBasicMaterial color={(i % 2 === 0) ? '#064e3b' : '#065f46'} />
        </mesh>
      ))}

      {/* Lines */}
      <group position={[0, 0, 0.2]}>
        <mesh position={[0, 0, 0]}><ringGeometry args={[68, 70, 64]} /><meshBasicMaterial color="white" opacity={0.4} transparent /></mesh>
        <mesh position={[0, 0, 0]}><planeGeometry args={[2, FIELD_HEIGHT]} /><meshBasicMaterial color="white" opacity={0.4} transparent /></mesh>
        {/* Borders */}
        <mesh position={[0, FIELD_HEIGHT/2, 0]}><planeGeometry args={[FIELD_WIDTH, 4]} /><meshBasicMaterial color="white" /></mesh>
        <mesh position={[0, -FIELD_HEIGHT/2, 0]}><planeGeometry args={[FIELD_WIDTH, 4]} /><meshBasicMaterial color="white" /></mesh>
        <mesh position={[FIELD_WIDTH/2, 0, 0]}><planeGeometry args={[4, FIELD_HEIGHT]} /><meshBasicMaterial color="white" /></mesh>
        <mesh position={[-FIELD_WIDTH/2, 0, 0]}><planeGeometry args={[4, FIELD_HEIGHT]} /><meshBasicMaterial color="white" /></mesh>
      </group>
    </group>
  );
};

const Goals: React.FC = () => {
  const halfW = FIELD_WIDTH / 2;
  const goalZ = ENV_CONFIG.goalWidth;

  return (
    <>
      <group position={[-halfW, 25, 0]}>
        <mesh position={[-5, 0, 0]}><boxGeometry args={[10, 50, goalZ]} /><meshStandardMaterial color="#7f1d1d" transparent opacity={0.3} /></mesh>
        <mesh position={[0, 0, goalZ/2]}><boxGeometry args={[4, 50, 4]} /><meshStandardMaterial color="#ef4444" /></mesh>
        <mesh position={[0, 0, -goalZ/2]}><boxGeometry args={[4, 50, 4]} /><meshStandardMaterial color="#ef4444" /></mesh>
        <mesh position={[0, 25, 0]} rotation={[Math.PI/2, 0, 0]}><cylinderGeometry args={[2, 2, goalZ, 8]} /><meshStandardMaterial color="#ef4444" /></mesh>
      </group>

      <group position={[halfW, 25, 0]}>
        <mesh position={[5, 0, 0]}><boxGeometry args={[10, 50, goalZ]} /><meshStandardMaterial color="#1e3a8a" transparent opacity={0.3} /></mesh>
        <mesh position={[0, 0, goalZ/2]}><boxGeometry args={[4, 50, 4]} /><meshStandardMaterial color="#3b82f6" /></mesh>
        <mesh position={[0, 0, -goalZ/2]}><boxGeometry args={[4, 50, 4]} /><meshStandardMaterial color="#3b82f6" /></mesh>
        <mesh position={[0, 25, 0]} rotation={[Math.PI/2, 0, 0]}><cylinderGeometry args={[2, 2, goalZ, 8]} /><meshStandardMaterial color="#3b82f6" /></mesh>
      </group>
    </>
  );
};

interface MatchArenaProps {
  gameState: GameState;
  position?: [number, number, number];
  label?: string;
}

const MatchArena: React.FC<MatchArenaProps> = ({ gameState, position = [0, 0, 0], label }) => {
  return (
    <group position={position}>
      {label && (
        <Text position={[0, 200, -FIELD_HEIGHT/2 - 100]} fontSize={60} color="#94a3b8" rotation={[-Math.PI / 4, 0, 0]} anchorX="center" anchorY="middle">
          {label}
        </Text>
      )}

      <FieldBase />
      <Goals />
      {gameState.players.map(p => (
        <PlayerMesh key={p.id} player={p} isPossessing={p.hasBall} />
      ))}
      <BallMesh ball={gameState.ball} />

      {/* Goal Overlay */}
      {gameState.lastScorer && gameState.ball.isGoal && (
        <Text position={[0, 100, 0]} fontSize={80} color="white" outlineWidth={4} outlineColor={gameState.lastScorer === 'RED' ? '#ef4444' : '#3b82f6'} anchorX="center" anchorY="middle">
          GOAL!
        </Text>
      )}
    </group>
  );
};

interface GameSceneProps {
  gameState: GameState; 
  allStates: GameState[];
  viewMode: 'focus' | 'grid';
  currentEnvIndex: number;
}

const GameScene: React.FC<GameSceneProps> = ({ gameState, allStates, viewMode }) => {
  const GRID_SPACING_X = FIELD_WIDTH + 200;
  const GRID_SPACING_Z = FIELD_HEIGHT + 200;

  const getGridPosition = (index: number): [number, number, number] => {
    const row = Math.floor(index / 2);
    const col = index % 2;
    return [col * GRID_SPACING_X - GRID_SPACING_X / 2, 0, row * GRID_SPACING_Z - GRID_SPACING_Z / 2];
  };

  return (
    <div className="w-full h-[600px] bg-slate-900 rounded-xl overflow-hidden shadow-2xl border border-slate-700 relative">
      <Canvas shadows dpr={[1, 2]}>
        <color attach="background" args={['#0f172a']} />
        
        {viewMode === 'focus' ? (
          <PerspectiveCamera makeDefault position={[0, 450, 450]} fov={50} />
        ) : (
          <PerspectiveCamera makeDefault position={[0, 1600, 1200]} fov={45} />
        )}

        <OrbitControls enablePan={true} enableZoom={true} maxPolarAngle={Math.PI / 2.2} />
        
        <ambientLight intensity={0.8} />
        <hemisphereLight intensity={0.5} groundColor="#0f172a" skyColor="#ffffff" />
        <directionalLight 
          position={[100, 500, 200]} 
          intensity={2.0} 
          castShadow 
          shadow-mapSize={[2048, 2048]} 
          shadow-bias={-0.0001} 
        />

        <React.Suspense fallback={null}> 
           {viewMode === 'focus' ? (
              <MatchArena gameState={gameState} />
           ) : (
             <group>
               {allStates.map((state, idx) => (
                 <MatchArena key={idx} gameState={state} position={getGridPosition(idx)} label={`ENV ${idx + 1}`} />
               ))}
             </group>
           )}
        </React.Suspense>
      </Canvas>
    </div>
  );
};

export default GameScene;