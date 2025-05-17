// OrbitChartWithHandshake.tsx
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import {
  twoline2satrec,
  propagate,
  gstime,
  eciToGeodetic,
  degreesLat,
  degreesLong,
} from 'satellite.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

interface TLEEntry {
  name: string;
  line1: string;
  line2: string;
}

interface HandshakeEvent {
  lat: number;
  lon: number;
  alt: number; // in meters
  time: Date;
  beacon: string;
  relay: string;
}

interface OrbitChartProps {
  tleData: TLEEntry[];
  handshakePoints: HandshakeEvent[];
}

const OrbitChartWithHandshake: React.FC<OrbitChartProps> = ({ tleData, handshakePoints }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    console.log('收到的 tleData 数量:', tleData.length);
    console.log('收到的 handshakePoints 数量:', handshakePoints.length);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    containerRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 1;
    controls.maxDistance = 50;

    const earthGeometry = new THREE.SphereGeometry(1, 32, 32);
    const earthMaterial = new THREE.MeshBasicMaterial({ color: 0x0033aa, wireframe: true });
    const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
    scene.add(earthMesh);

    const testBall = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xff0000 })
    );
    scene.add(testBall);

    const baseTime = new Date();

    tleData.forEach((tle, idx) => {
      const satrec = twoline2satrec(tle.line1, tle.line2);
      const positions: THREE.Vector3[] = [];

      for (let i = 0; i <= 90; i++) {
        const time = new Date(baseTime.getTime() + i * 60 * 1000);
        const posVel = propagate(satrec, time);

        if (!posVel || !posVel.position) continue;

        const gmst = gstime(time);
        const geo = eciToGeodetic(posVel.position, gmst);
        const lat = degreesLat(geo.latitude);
        const lon = degreesLong(geo.longitude);
        const alt = geo.height;

        const radius = 1 + alt / 6371;
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lon + 180) * (Math.PI / 180);

        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.cos(phi);
        const z = radius * Math.sin(phi) * Math.sin(theta);

        positions.push(new THREE.Vector3(x, y, z));
      }

      console.log(`卫星 ${tle.name} 有效轨道点数:`, positions.length);

      if (positions.length > 0) {
        const orbitGeometry = new THREE.BufferGeometry().setFromPoints(positions);
        const orbitMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
        const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
        scene.add(orbitLine);
      }
    });

    handshakePoints.forEach(({ lat, lon, alt }, i) => {
      const radius = 1 + alt / 6371 / 1000;
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.cos(phi);
      const z = radius * Math.sin(phi) * Math.sin(theta);

      const marker = new THREE.Mesh(
        new THREE.SphereGeometry(0.03, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0x00ff00 })
      );
      marker.position.set(x, y, z);
      scene.add(marker);
    });

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      renderer.dispose();
      if (containerRef.current?.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [tleData, handshakePoints]);

  return <div ref={containerRef} style={{ width: '100%', height: '600px' }} />;
};

export default OrbitChartWithHandshake;

