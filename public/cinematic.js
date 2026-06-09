/**
 * NEBULA CINEMATIC ENGINE v2.0
 * The most advanced cinematic streaming UI ever built.
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
        // 1. Load Dependencies
        await this.loadDependencies();
        
        // 2. Setup Base
        this.setupScene();
        this.setupSmoothScroll();
        this.setupSVGFilters();
        
        // 3. Features
        this.createVolumetricAurora(); // Feature 5
        this.createFloatingParticles(); // Feature 1
        this.setupMagneticButtons();   // Feature 3
        this.setup3DMovieCards();     // Feature 2
        
        // 4. Start Engine
        this.setupEventListeners();
        this.animate();
        
        console.log("Nebula Cinematic Engine v2.0 - ONLINE");
    }

    async loadDependencies() {
        const libs = [
            'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.0/three.min.js',
            'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js',
            'https://unpkg.com/lenis@1.1.9/dist/lenis.min.js'
        ];
        for (const lib of libs) {
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
            duration: 1.2,
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
        const svg = `
            <svg class="liquid-filter">
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
        // High-end Shader Material for Aurora (Simulating Fluid Dynamics)
        const vertexShader = `
            varying vec2 vUv;
            varying float vElevation;
            uniform float uTime;
            
            void main() {
                vUv = uv;
                vec3 pos = position;
                float elevation = sin(pos.x * 0.5 + uTime * 0.5) * cos(pos.y * 0.5 + uTime * 0.3) * 0.5;
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
                vec3 color1 = vec4(0.0, 0.82, 1.0, 1.0).rgb; // Sci-Fi Blue
                vec3 color2 = vec4(0.23, 0.28, 0.84, 1.0).rgb; // Fantasy Purple
                
                float mixStrength = (vElevation + 0.5) * 0.8;
                vec3 color = mix(color1, color2, mixStrength);
                
                float alpha = (sin(vUv.x * 5.0 + uTime) * 0.5 + 0.5) * 0.2;
                gl_FragColor = vec4(color, alpha);
            }
        `;

        const geometry = new THREE.PlaneGeometry(30, 15, 64, 64);
        const material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: { uTime: { value: 0 } },
            transparent: true,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });

        this.aurora = new THREE.Mesh(geometry, material);
        this.aurora.rotation.x = -Math.PI * 0.3;
        this.aurora.position.y = -2;
        this.aurora.position.z = -2;
        this.scene.add(this.aurora);
    }

    createFloatingParticles() {
        const count = 3000;
        const positions = new Float32Array(count * 3);
        const sizes = new Float32Array(count);

        for(let i=0; i<count*3; i++) {
            positions[i] = (Math.random() - 0.5) * 20;
            if(i % 3 === 2) positions[i] -= 5; // Push back in Z
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            size: 0.02,
            color: 0x00d2ff,
            transparent: true,
            opacity: 0.4,
            blending: THREE.AdditiveBlending
        });

        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
    }

    setupMagneticButtons() {
        // Target all premium buttons
        const btns = document.querySelectorAll('.cta-btn, #uploadBtn, #send-btn, .liquid-btn');
        btns.forEach(btn => {
            // Wrap for magnetic effect if not already
            if(!btn.parentElement.classList.contains('magnetic-wrap')) {
                const wrap = document.createElement('span');
                wrap.className = 'magnetic-wrap';
                btn.parentNode.insertBefore(wrap, btn);
                wrap.appendChild(btn);
            }

            btn.addEventListener('mousemove', (e) => {
                const rect = btn.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                
                gsap.to(btn, {
                    x: x * 0.5,
                    y: y * 0.5,
                    scale: 1.05,
                    duration: 0.4,
                    ease: "power2.out"
                });
                
                // Feature 3: Surface Ripple (Simulated by changing glow)
                btn.style.boxShadow = `0 0 30px rgba(0, 210, 255, ${0.4 + Math.abs(x/100)})`;
            });

            btn.addEventListener('mouseleave', () => {
                gsap.to(btn, {
                    x: 0,
                    y: 0,
                    scale: 1,
                    duration: 0.7,
                    ease: "elastic.out(1, 0.3)"
                });
                btn.style.boxShadow = '';
            });
            
            // Feature 3: Energy Wave on Click
            btn.addEventListener('mousedown', () => {
                gsap.to(btn, { scale: 0.95, duration: 0.1 });
            });
            btn.addEventListener('mouseup', () => {
                gsap.to(btn, { scale: 1.05, duration: 0.2 });
            });
        });
    }

    setup3DMovieCards() {
        // This is handled via event listener in setupEventListeners for efficiency
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

            // Feature 1: Hero Scene Parallax
            if (this.particles) {
                gsap.to(this.particles.rotation, {
                    y: this.targetMouse.x * 0.1,
                    x: -this.targetMouse.y * 0.1,
                    duration: 1
                });
            }

            // Feature 2: Ultra-Realistic Cards (3D Tilt + Reflection)
            const cards = document.querySelectorAll('.video-card');
            cards.forEach(card => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                const dist = Math.sqrt(x*x + y*y);

                if (dist < 400) {
                    const rotX = -y / 15;
                    const rotY = x / 15;
                    gsap.to(card, {
                        rotateX: rotX,
                        rotateY: rotY,
                        z: 20,
                        duration: 0.5,
                        ease: "power2.out",
                        transformPerspective: 1000
                    });
                    
                    // Dynamic Reflection
                    card.style.background = `
                        linear-gradient(${135 + x/10}deg, 
                        rgba(255,255,255,0.1) 0%, 
                        rgba(255,255,255,0.03) 50%)
                    `;
                } else {
                    gsap.to(card, { rotateX: 0, rotateY: 0, z: 0, duration: 0.8 });
                    card.style.background = '';
                }
            });
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        const time = performance.now() * 0.001;

        if(this.aurora) {
            this.aurora.material.uniforms.uTime.value = time;
        }

        if(this.particles) {
            this.particles.rotation.y += 0.0005;
        }

        this.renderer.render(this.scene, this.camera);
    }
}

// Feature 4: Infinite Cinematic Carousel Engine
class CinematicCarousel {
    constructor(selector) {
        this.container = document.querySelector(selector);
        if(!this.container) return;
        
        this.track = this.container.querySelector('.carousel-track') || this.createTrack();
        this.isDown = false;
        this.startX = 0;
        this.scrollLeft = 0;
        this.velocity = 0;
        this.lastX = 0;
        
        this.init();
    }

    createTrack() {
        const track = document.createElement('div');
        track.className = 'carousel-track';
        // Move children to track
        while(this.container.firstChild) {
            track.appendChild(this.container.firstChild);
        }
        this.container.appendChild(track);
        return track;
    }

    init() {
        this.track.addEventListener('mousedown', (e) => {
            this.isDown = true;
            this.startX = e.pageX - this.track.offsetLeft;
            this.scrollLeft = this.getCurrentTransform();
            this.velocity = 0;
            this.track.style.transition = 'none';
        });

        document.addEventListener('mouseup', () => {
            this.isDown = false;
            // Apply Momentum
            gsap.to(this, {
                velocity: 0,
                duration: 1.5,
                ease: "power4.out",
                onUpdate: () => {
                    if(!this.isDown) {
                        const current = this.getCurrentTransform();
                        this.applyTransform(current + this.velocity * 2);
                    }
                }
            });
        });

        document.addEventListener('mousemove', (e) => {
            if(!this.isDown) return;
            e.preventDefault();
            const x = e.pageX - this.track.offsetLeft;
            const walk = (x - this.startX);
            this.velocity = x - this.lastX;
            this.lastX = x;
            this.applyTransform(this.scrollLeft + walk);
        });

        this.animateCarousel();
    }

    getCurrentTransform() {
        const style = window.getComputedStyle(this.track);
        const matrix = new WebKitCSSMatrix(style.transform);
        return matrix.m41;
    }

    applyTransform(x) {
        // Handle Infinite Loop (Reset position if needed)
        // For simplicity in this v1, we just apply transform
        this.track.style.transform = `translateX(${x}px)`;
        
        // Feature 4: Momentum Scaling & Blur
        const cards = this.track.querySelectorAll('.video-card');
        const centerX = window.innerWidth / 2;
        
        cards.forEach(card => {
            const rect = card.getBoundingClientRect();
            const cardCenter = rect.left + rect.width / 2;
            const distFromCenter = Math.abs(centerX - cardCenter);
            const scale = Math.max(0.8, 1.1 - distFromCenter / 1000);
            const blur = Math.min(5, distFromCenter / 200);
            const rotateY = (cardCenter - centerX) / 20;

            gsap.to(card, {
                scale: scale,
                filter: `blur(${blur}px)`,
                rotateY: rotateY,
                duration: 0.1
            });
        });
    }

    animateCarousel() {
        // Initial entrance
        gsap.from('.video-card', {
            y: 100,
            opacity: 0,
            stagger: 0.1,
            duration: 1.2,
            ease: "expo.out"
        });
    }
}

// Initial Boot
document.addEventListener('DOMContentLoaded', () => {
    window.nebulaEngine = new CinematicEngine();
    
    // Convert Video Grid to Carousel on Dashboard
    if(document.getElementById('videoGrid')) {
        const grid = document.getElementById('videoGrid');
        grid.className = 'carousel-container';
        grid.id = 'carousel-engine';
        
        // Wait for videos to load then start carousel
        const checkVideos = setInterval(() => {
            if(grid.querySelectorAll('.video-card').length > 0) {
                window.nebulaCarousel = new CinematicCarousel('#carousel-engine');
                clearInterval(checkVideos);
            }
        }, 100);
    }
});
