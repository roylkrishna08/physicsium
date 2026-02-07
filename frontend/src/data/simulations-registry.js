// Central registry of all simulations in the Physicsium platform
// Add new simulations here and they will automatically sync to admin dashboard

export const simulationsRegistry = [
    // Experimental Skills
    { simulationId: 'freelab', name: 'Free Lab (Multipurpose)', category: 'experimental' },
    { simulationId: 'vernier-calipers', name: 'Vernier Calipers', category: 'experimental' },
    { simulationId: 'screw-gauge', name: 'Screw Gauge', category: 'experimental' },
    { simulationId: 'simple-pendulum', name: 'Simple Pendulum', category: 'experimental' },
    { simulationId: 'ohms-law', name: "Ohm's Law", category: 'experimental' },
    { simulationId: 'meter-bridge', name: 'Meter Bridge', category: 'experimental' },
    { simulationId: 'sonometer', name: 'Sonometer', category: 'experimental' },
    { simulationId: 'focal-length-concave', name: 'Focal Length of Concave Mirror', category: 'experimental' },
    { simulationId: 'focal-length-convex', name: 'Focal Length of Convex Lens', category: 'experimental' },
    { simulationId: 'youngs-modulus', name: "Young's Modulus", category: 'experimental' },
    { simulationId: 'surface-tension', name: 'Surface Tension by Capillary Rise', category: 'experimental' },
    { simulationId: 'viscosity', name: 'Coefficient of Viscosity', category: 'experimental' },
    { simulationId: 'refractive-index', name: 'Refractive Index of Glass', category: 'experimental' },
    { simulationId: 'resistance-thermometer', name: 'Resistance of Thermometer', category: 'experimental' },
    { simulationId: 'potentiometer-emf', name: 'Potentiometer - EMF of Cell', category: 'experimental' },
    { simulationId: 'resistivity', name: 'Resistivity of Material', category: 'experimental' },

    // Kinematics
    { simulationId: 'projectile-motion', name: 'Projectile Motion', category: 'kinematics' },
    { simulationId: 'relative-velocity', name: 'Relative Velocity', category: 'kinematics' },
    { simulationId: 'circular-motion', name: 'Uniform Circular Motion', category: 'kinematics' },

    // Electrostatics
    { simulationId: 'coulombs-law', name: "Coulomb's Law", category: 'electrostatics' },
    { simulationId: 'electric-field', name: 'Electric Field', category: 'electrostatics' },
    { simulationId: 'gauss-law', name: "Gauss's Law", category: 'electrostatics' },
    { simulationId: 'electric-potential', name: 'Electric Potential', category: 'electrostatics' },
    { simulationId: 'capacitors', name: 'Capacitors', category: 'electrostatics' },
    { simulationId: 'dipole', name: 'Electric Dipole', category: 'electrostatics' },

    // Gravitation
    { simulationId: 'keplers-laws', name: "Kepler's Laws", category: 'gravitation' },
    { simulationId: 'gravitational-field', name: 'Gravitational Field', category: 'gravitation' },
    { simulationId: 'satellite-motion', name: 'Satellite Motion', category: 'gravitation' },
    { simulationId: 'gravitational-potential', name: 'Gravitational Potential', category: 'gravitation' },
];
