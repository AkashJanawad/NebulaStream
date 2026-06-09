/**
 * NEBULA CINEMATIC ENGINE v3.0 - PRODUCTION READY
 * The ultimate cinematic streaming experience.
 */

class CinematicEngine {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.aurora = null;
        this.lenis = null;
        this.mouse = new THREE.Vector2();
        this.targetMouse = new THREE.Vector2();
        
        this.init();
    }

    async init() {
        await this.loadDependencies();
        
        this.setupScene();
        this.setupSmoothScroll();
        this.setupSVGFilters();
        
        this.createVolumetricAurora(); 
        this.createFloatingParticles(); 
        this.setupMagneticButtons();   
        
        this.setupEventListeners();
        this.runEntranceAnimations();
        this.animate();
        
        console.log("Nebula Cinematic Engine v3.0 - PRODUCTION READY");
    }

    async loadDependencies() {
        const libs = [
            'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.0/three.min.js',
            'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js',
            'https://unpkg.com/lenis@1.1.9/dist/lenis.min.js'
        ];
        for (const lib of libs) {
            if (window[lib.split('/').pop().split('.')[0]]) continue; // Skip if already loaded
            await new Promise(resolve => {
                const script = document.createElement('script');
                script.src = lib;
                script.onload = resolve;
                document.head.appendChild(script);
            });
        }
    }

    setupScene() {
        const canvas = document.createElement('canvas');
        canvas.id = 'cinematic-bg';
        document.body.prepend(canvas);

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.z = 5;

        this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }

    setupSmoothScroll() {
        this.lenis = new Lenis({
            duration: 1.5,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smoothWheel: true
        });
        
        const raf = (time) => {
            this.lenis.raf(time);
            requestAnimationFrame(raf);
        };
        requestAnimationFrame(raf);
    }

    setupSVGFilters() {
        if (document.getElementById('goo')) return;
        const svg = `
            <svg class="liquid-filter" style="display:none">
                <defs>
                    <filter id="goo">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
                        <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" result="goo" />
                        <feComposite in="SourceGraphic" in2="goo" operator="atop"/>
                    </filter>
                </defs>
            </svg>
        `;
        document.body.insertAdjacentHTML('beforeend', svg);
    }

    createVolumetricAurora() {
        const vertexShader = `
            varying vec2 vUv;
            varying float vElevation;
            uniform float uTime;
            void main() {
                vUv = uv;
                vec3 pos = position;
                float elevation = sin(pos.x * 0.3 + uTime * 0.4) * cos(pos.y * 0.4 + uTime * 0.2) * 0.8;
                pos.z += elevation;
                vElevation = elevation;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
            }
        `;
        const fragmentShader = `
            varying vec2 vUv;
            varying float vElevation;
            uniform float uTime;
            void main() {
                vec3 color1 = vec3(0.0, 0.82, 1.0); 
                vec3 color2 = vec3(0.23, 0.28, 0.84); 
                float mixStrength = (vElevation + 0.8) * 0.6;
                vec3 color = mix(color1, color2, mixStrength);
                float alpha = (sin(vUv.x * 3.0 + uTime * 0.5) * 0.5 + 0.5) * 0.15;
                gl_FragColor = vec4(color, alpha);
            }
        `;

        const geometry = new THREE.PlaneGeometry(40, 20, 100, 100);
        const material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: { uTime: { value: 0 } },
            transparent: true,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });

        this.aurora = new THREE.Mesh(geometry, material);
        this.aurora.rotation.x = -Math.PI * 0.4;
        this.aurora.position.y = -3;
        this.aurora.position.z = -2;
        this.scene.add(this.aurora);
    }

    createFloatingParticles() {
        const count = 4000;
        const positions = new Float32Array(count * 3);
        for(let i=0; i<count*3; i++) {
            positions[i] = (Math.random() - 0.5) * 25;
        }
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const material = new THREE.PointsMaterial({
            size: 0.015,
            color: 0x00d2ff,
            transparent: true,
            opacity: 0.3,
            blending: THREE.AdditiveBlending
        });
        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
    }

    setupMagneticButtons() {
        document.body.addEventListener('mousemove', (e) => {
            const btns = document.querySelectorAll('.liquid-btn, #uploadBtn');
            btns.forEach(btn => {
                const rect = btn.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                const dist = Math.sqrt(x*x + y*y);

                if (dist < 120) {
                    gsap.to(btn, {
                        x: x * 0.4,
                        y: y * 0.4,
                        scale: 1.05,
                        duration: 0.4,
                        ease: "power2.out"
                    });
                } else {
                    gsap.to(btn, { x: 0, y: 0, scale: 1, duration: 0.7, ease: "elastic.out(1, 0.3)" });
                }
            });
        });
    }

    runEntranceAnimations() {
        const tl = gsap.timeline();
        
        tl.from('nav', { y: -100, opacity: 0, duration: 1.2, ease: "expo.out" });
        tl.from('h1', { y: 50, opacity: 0, duration: 1, ease: "power4.out" }, "-=0.8");
        tl.from('p', { y: 30, opacity: 0, duration: 1, ease: "power4.out" }, "-=0.6");
        tl.from('.auth-box, .container', { y: 50, opacity: 0, scale: 0.95, duration: 1.2, ease: "expo.out" }, "-=0.6");
        
        if (document.querySelector('.video-card')) {
            tl.from('.video-card', {
                y: 60,
                opacity: 0,
                stagger: 0.1,
                duration: 1,
                ease: "power3.out"
            }, "-=0.4");
        }
    }

    setupEventListeners() {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        document.addEventListener('mousemove', (e) => {
            this.targetMouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.targetMouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

            const cards = document.querySelectorAll('.video-card');
            cards.forEach(card => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                const dist = Math.sqrt(x*x + y*y);

                if (dist < 350) {
                    gsap.to(card, {
                        rotateX: -y / 12,
                        rotateY: x / 12,
                        z: 30,
                        duration: 0.5,
                        ease: "power2.out",
                        transformPerspective: 1200
                    });
                    card.style.borderColor = "var(--accent)";
                    card.style.boxShadow = "0 20px 50px rgba(0,0,0,0.5), 0 0 20px var(--accent-glow)";
                } else {
                    gsap.to(card, { rotateX: 0, rotateY: 0, z: 0, duration: 0.8 });
                    card.style.borderColor = "";
                    card.style.boxShadow = "";
                }
            });
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        const time = performance.now() * 0.001;
        if(this.aurora) this.aurora.material.uniforms.uTime.value = time;
        if(this.particles) {
            this.particles.rotation.y += 0.0003;
            this.particles.position.y = Math.sin(time * 0.5) * 0.1;
        }
        this.renderer.render(this.scene, this.camera);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.nebulaEngine = new CinematicEngine();
});
