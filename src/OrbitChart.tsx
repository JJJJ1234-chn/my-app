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

interface OrbitChartProps {
  tleData: TLEEntry[];
}

const OrbitChart: React.FC<OrbitChartProps> = ({ tleData }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 10;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    containerRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    const earth = new THREE.Mesh(
      new THREE.SphereGeometry(1, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0x0033aa, wireframe: true })
    );
    scene.add(earth);

    const baseTime = new Date();

    tleData.forEach((tle) => {
      const satrec = twoline2satrec(tle.line1, tle.line2);
      const points: THREE.Vector3[] = [];

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

        points.push(new THREE.Vector3(x, y, z));
      }

      const orbit = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(points),
        new THREE.LineBasicMaterial({ color: 0xff0000 })
      );
      scene.add(orbit);
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
  }, [tleData]);

  return <div ref={containerRef} style={{ width: '100%', height: '600px' }} />;
};

export default OrbitChart;