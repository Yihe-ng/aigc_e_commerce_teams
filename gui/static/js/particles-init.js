const pJSConfig = {
    particles: {
        number: { 
            value: Math.floor(window.innerWidth / 10),
            density: { enable: true }
        },
        color: { value: ["#5eead4", "#38bdf8", "#22d3ee"] },
        shape: { type: "circle" },
        opacity: { 
            value: 0.7,
            random: true 
        },
        size: { 
            value: 2.5,
            random: { min: 1, max: 4 } 
        },
        line_linked: {
            distance: 120,
            color: "#5eead4",
            opacity: 0.4,
            width: 1
        },
        move: {
            enable: true,
            speed: 0.8,
            direction: "none",
            out_mode: "bounce"
        }
    },
    interactivity: {
        detect_on: "window",
        events: {
            onhover: { enable: true, mode: "repulse" }
        }
    }
};

document.addEventListener('DOMContentLoaded', function() {
    particlesJS('particles-js', pJSConfig);
});

// 窗口大小变化时重置
window.addEventListener('resize', function() {
    if(window.pJSDom && window.pJSDom.length > 0){
        window.pJSDom[0].pJS.fn.vendors.destroypJS();
        particlesJS('particles-js', pJSConfig);
    }
}); 