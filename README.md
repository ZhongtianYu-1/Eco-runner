# Eco-runner
EcoRunner: a game that provides educational platform that aims to teach awareness through gameplay.


An educational platformer game built with MakeCode Arcade that teaches environmental awareness through engaging gameplay. Players collect recyclable items while avoiding hazardous materials in a dynamic physics-based world.

## About the Game

Eco-runner combines classic platformer mechanics with environmental education. The game challenges players to navigate through levels, collect recyclable items, and avoid hazardous materials while learning about proper waste disposal.

### Key Features:
- **Smart Hazard Relocation System** - Hazards intelligently find new positions when contacted, maintaining game balance
- **Dynamic Goal Activation** - Recycling bin unlocks after collecting required items, creating progressive achievement
- **Smooth Platformer Physics** - Responsive controls with advanced collision detection
- **Multiple Level Progression** - Increasing difficulty with scalable challenges
- **Visual Feedback Systems** - Particle effects and state changes for clear user feedback

## How to Play

### Controls:
- **← → Arrow Keys**: Move left and right
- **A Button/space button**: Jump
- **Automatic**: Collection and collision detection

### Objectives:
1. **Collect** all recyclable items (blue, green, red circles)
2. **Avoid** hazardous materials (purple, orange circles) 
3. **Reach** the activated recycling bin to complete the level
4. **Progress** through increasingly challenging levels

### Game Elements:
- **Recyclables**: Plastic bottles (blue), glass jars (green), paper (red)
- **Hazards**: Chemical waste (purple), battery acid (orange)
- **Goal**: Recycling bin that activates after collection
- **Environment**: Moving platforms and dynamic obstacles


### Systems Architecture:

```javascript
// State Management
updateGoalStatus()           // Controls goal activation state
completeLevel()             // Handles level progression
checkPlayerBounds()         // Boundary detection and respawning

// Physics & Movement  
checkPlatformCollisions()   // Advanced collision detection
updatePlayerOnMovingPlatform() // Platform interaction physics
setupPlayerControls()       // Responsive input handling

// Game Object Management
createHazards()            // Intelligent obstacle placement
findNewHazardPosition()    // Spatial algorithm for fair placement
createRecyclables()        // Strategic item placement

// Visual & Audio Systems
createCollectionEffect()   // Particle effects for feedback
createHazardEffects()      // Visual indicators for hazards
initializeSounds()         // Audio feedback system
