// Extend SpriteKind with new categories for our game objects
namespace SpriteKind {
    export const Recyclable = SpriteKind.create()      // Recyclable items player collects
    export const Hazard = SpriteKind.create()          // Dangerous objects to avoid
    export const PowerUp = SpriteKind.create()         // Future power-up items
    export const Goal = SpriteKind.create()            // Recycling bin to reach
    export const Wall = SpriteKind.create()            // Platforms and boundaries
    export const Effect = SpriteKind.create()          // Visual effects and particles
    export const Background = SpriteKind.create()      // Background elements like clouds
    export const MovingPlatform = SpriteKind.create()  // Platforms that move horizontally
}

// Game state variables
let player: Sprite = null                             // Player character sprite
let level = 1                                         // Current level number
let lives = 3                                         // Player lives remaining
let score = 0                                         // Current score
let recyclablesCollected = 0                          // Number of recyclables collected
let recyclablesNeeded = 4                             // Recyclables needed to unlock goal
let recyclableSprites: Sprite[] = []                  // Array to track all recyclable items
let collectionEffect: music.Playable = null           // Sound when collecting recyclables
let hazards: Sprite[] = []                            // Array to track all hazard objects
let hazardSound: music.Playable = null                // Sound when hitting hazard
let gameOverSound: music.Playable = null              // Sound when game over
let isGameOver = false                                // Game over state flag
let jumpForgivenessFrames = 0                         // Frames allowed to jump after leaving ground
const MAX_JUMP_FORGIVENESS = 5                        // Maximum jump forgiveness frames
let goal: Sprite = null                               // Recycling bin sprite
let goalActive = false                                // Whether goal is accessible
let levelUpSound: music.Playable = null               // Sound when completing level
let currentLevelScore = 0                             // Score for current level
let isLevelComplete = false                           // Level completion state flag
let hazardTypes: Image[] = []                         // Array of hazard sprite images

// Player physics variables
let playerSpeed = 100                                 // Horizontal movement speed
let jumpPower = 200                                   // Vertical jump force
let isOnGround = false                                // Whether player is on a platform
let currentPlatform: Sprite = null                    // Platform player is currently standing on

// Cloud management
let clouds: Sprite[] = []                             // Array to track cloud sprites

/**
 * Initialize all sound effects for the game
 */
function initializeSounds() {
    collectionEffect = music.melodyPlayable(music.baDing)     // Recyclable collection sound
    hazardSound = music.melodyPlayable(music.wawawawaa)       // Hazard collision sound
    gameOverSound = music.melodyPlayable(music.bigCrash)      // Game over sound
    levelUpSound = music.melodyPlayable(music.powerUp)        // Level completion sound
}

/**
 * Main environment setup function - creates the entire game world
 */
function createEnvironment() {
    // Set up a nice background color (sky blue)
    scene.setBackgroundColor(9)

    // Initialize sounds
    initializeSounds()

    // Create background elements
    createBackgroundElements()

    // Create platforms
    createPlatforms()

    // Create boundaries
    createBoundaries()

    // Create player first
    createPlayer()

    // Set up goal overlap detection
    setupGoalOverlap()

    // Create hazards
    createHazards()

    // Create recyclables
    createRecyclables()

    // Set up collection system
    setupCollectionOverlap()

    // Set up hazard system
    setupHazardOverlap()

    // Set up UI
    setupUI()

    // Set up camera
    setupCamera()

    // Show level info
    if (level === 1) {
        game.showLongText("Level " + level + " Recycling Mission!\nCollect " + recyclablesNeeded + " recyclable items\nAvoid the hazardous materials\nReach the recycling bin to win!← → Move, A Jump" + lives, DialogLayout.Bottom)
    } else {
        game.showLongText(
            "Level " + level + "!\n\n" +
            "Collect " + recyclablesNeeded + " recyclables\n" +
            "Lives: " + lives,
            DialogLayout.Bottom
        )
    }
}

/**
 * Create the player character and set up physics/controls
 */
function createPlayer() {
    player = sprites.create(img`
        . . . . . . f f f f . . . . . . 
        . . . . f f f 2 2 f f f . . . . 
        . . . f f f 2 2 2 2 f f f . . . 
        . . f f f e e e e e e f f f . . 
        . . f f e 2 2 2 2 2 2 e e f . . 
        . . f e 2 f f f f f f 2 e f . . 
        . . f f f f e e e e f f f f . . 
        . f f e f b f 4 4 f b f e f f . 
        . f e e 4 1 f d d f 1 4 e e f . 
        . . f e e d d d d d d e e f . . 
        . . . f e e 4 4 4 4 e e f . . . 
        . . e 4 f 2 2 2 2 2 2 f 4 e . . 
        . . 4 d f 2 2 2 2 2 2 f d 4 . . 
        . . 4 4 f 4 4 5 5 4 4 f 4 4 . . 
        . . . . . f f f f f f . . . . . 
        . . . . . f f . . f f . . . . . 
    `, SpriteKind.Player)

    // Set player physics
    player.ay = 400  // Gravity
    player.z = 10    // In front of platforms

    // Position player on a platform
    positionPlayerOnPlatform()

    // Set up player controls
    setupPlayerControls()

    // Set up collision detection
    setupCollisions()
}

/**
 * Create all recyclable items in the level
 */
function createRecyclables() {
    // Clear any existing recyclables
    for (let item of recyclableSprites) {
        item.destroy()
    }
    recyclableSprites = []

    // Create different types of recyclable items
    let recyclableTypes = [
        img`
            . . . . . . . . . . . . . . . . 
            . . . . . . 4 4 4 4 . . . . . . 
            . . . . 4 4 4 4 4 4 4 4 . . . . 
            . . . 4 4 4 4 4 4 4 4 4 4 . . . 
            . . 4 4 4 4 4 4 4 4 4 4 4 4 . . 
            . . 4 4 4 4 4 4 4 4 4 4 4 4 . . 
            . . 4 4 4 4 4 4 4 4 4 4 4 4 . . 
            . . 4 4 4 4 4 4 4 4 4 4 4 4 . . 
            . . 4 4 4 4 4 4 4 4 4 4 4 4 . . 
            . . 4 4 4 4 4 4 4 4 4 4 4 4 . . 
            . . 4 4 4 4 4 4 4 4 4 4 4 4 . . 
            . . . 4 4 4 4 4 4 4 4 4 4 . . . 
            . . . . 4 4 4 4 4 4 4 4 . . . . 
            . . . . . . 4 4 4 4 . . . . . . 
            . . . . . . . . . . . . . . . . 
            . . . . . . . . . . . . . . . . 
        `, // Plastic bottle (blue)
        img`
            . . . . . . . . . . . . . . . . 
            . . . . . . 2 2 2 2 . . . . . . 
            . . . . 2 2 2 2 2 2 2 2 . . . . 
            . . . 2 2 2 2 2 2 2 2 2 2 . . . 
            . . 2 2 2 2 2 2 2 2 2 2 2 2 . . 
            . . 2 2 2 2 2 2 2 2 2 2 2 2 . . 
            . . 2 2 2 2 2 2 2 2 2 2 2 2 . . 
            . . 2 2 2 2 2 2 2 2 2 2 2 2 . . 
            . . 2 2 2 2 2 2 2 2 2 2 2 2 . . 
            . . 2 2 2 2 2 2 2 2 2 2 2 2 . . 
            . . 2 2 2 2 2 2 2 2 2 2 2 2 . . 
            . . . 2 2 2 2 2 2 2 2 2 2 . . . 
            . . . . 2 2 2 2 2 2 2 2 . . . . 
            . . . . . . 2 2 2 2 . . . . . . 
            . . . . . . . . . . . . . . . . 
            . . . . . . . . . . . . . . . . 
        `, // Glass jar (green)
        img`
            . . . . . . . . . . . . . . . . 
            . . . . . . 8 8 8 8 . . . . . . 
            . . . . 8 8 8 8 8 8 8 8 . . . . 
            . . . 8 8 8 8 8 8 8 8 8 8 . . . 
            . . 8 8 8 8 8 8 8 8 8 8 8 8 . . 
            . . 8 8 8 8 8 8 8 8 8 8 8 8 . . 
            . . 8 8 8 8 8 8 8 8 8 8 8 8 . . 
            . . 8 8 8 8 8 8 8 8 8 8 8 8 . . 
            . . 8 8 8 8 8 8 8 8 8 8 8 8 . . 
            . . 8 8 8 8 8 8 8 8 8 8 8 8 . . 
            . . 8 8 8 8 8 8 8 8 8 8 8 8 . . 
            . . . 8 8 8 8 8 8 8 8 8 8 . . . 
            . . . . 8 8 8 8 8 8 8 8 . . . . 
            . . . . . . 8 8 8 8 . . . . . . 
            . . . . . . . . . . . . . . . . 
            . . . . . . . . . . . . . . . . 
        `  // Paper (gray)
    ]

    // Get all platforms to place recyclables on
    let allPlatforms = sprites.allOfKind(SpriteKind.Wall).concat(sprites.allOfKind(SpriteKind.MovingPlatform))
    let validPlatforms: Sprite[] = []

    // Filter out boundaries and ground platform (optional)
    for (let platform of allPlatforms) {
        if (platform.width > 15 && platform.x > 15 && platform.x < 145 && platform.y < 115) {
            validPlatforms.push(platform)
        }
    }

    // Create recyclables - one less than needed to create challenge
    for (let i = 0; i < recyclablesNeeded; i++) {
        if (validPlatforms.length > 0) {
            let randomPlatform = validPlatforms[Math.randomRange(0, validPlatforms.length - 1)]
            let recyclableType = recyclableTypes[Math.randomRange(0, recyclableTypes.length - 1)]

            createRecyclableItem(randomPlatform, recyclableType)
        }
    }

    console.log("Created " + (recyclablesNeeded) + " recyclable items")
}

/**
 * Create a single recyclable item on a specific platform
 * @param platform The platform to place the recyclable on
 * @param image The sprite image for the recyclable
 */
function createRecyclableItem(platform: Sprite, image: Image) {
    let recyclable = sprites.create(image, SpriteKind.Recyclable)

    // Position on the platform (not too close to edges)
    let platformLeft = platform.x - (platform.width / 2)
    let platformRight = platform.x + (platform.width / 2)

    // Try to find a position that's not too close to hazards
    let maxAttempts = 10
    let posX: number, posY: number
    let positionIsSafe = false

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        posX = Math.randomRange(platformLeft + 8, platformRight - 8)
        posY = platform.top - 8

        // Check if this position is too close to any hazard
        positionIsSafe = true
        for (let hazard of hazards) {
            let distance = Math.sqrt(Math.pow(posX - hazard.x, 2) + Math.pow(posY - hazard.y, 2))
            if (distance < 20) { // Minimum safe distance from hazards
                positionIsSafe = false
                break
            }
        }

        if (positionIsSafe) break
    }

    // If we couldn't find a safe position, place it anyway (better than nothing)
    if (!positionIsSafe) {
        posX = Math.randomRange(platformLeft + 8, platformRight - 8)
        posY = platform.top - 8
        console.log("Warning: Recyclable placed near hazard")
    }

    recyclable.setPosition(posX, posY)
    recyclable.z = 5

    recyclableSprites.push(recyclable)
}

/**
 * Create all hazards in the level with strategic placement
 */
function createHazards() {
    // Clear any existing hazards
    for (let hazard of hazards) {
        hazard.destroy()
    }
    hazards = []

    // Hazard types
    hazardTypes = [
        img`
            . . . . . . . . . . . . . . . . 
            . . . . . . . . . . . . . . . . 
            . . . . . . 7 7 7 7 . . . . . . 
            . . . . 7 7 7 7 7 7 7 7 . . . . 
            . . . 7 7 7 7 7 7 7 7 7 7 . . . 
            . . 7 7 7 7 7 7 7 7 7 7 7 7 . . 
            . . 7 7 7 7 7 7 7 7 7 7 7 7 . . 
            . . 7 7 7 7 7 7 7 7 7 7 7 7 . . 
            . . 7 7 7 7 7 7 7 7 7 7 7 7 . .
            . . 7 7 7 7 7 7 7 7 7 7 7 7 . .
            . . 7 7 7 7 7 7 7 7 7 7 7 7 . .
            . . 7 7 7 7 7 7 7 7 7 7 7 7 . .
            . . 7 7 7 7 7 7 7 7 7 7 7 7 . . 
            . . 7 7 7 7 7 7 7 7 7 7 7 7 . . 
            . . . 7 7 7 7 7 7 7 7 7 7 . . . 
            . . . . 7 7 7 7 7 7 7 7 . . . . 
            . . . . . . 7 7 7 7 . . . . . . 
            . . . . . . . . . . . . . . . . 
            . . . . . . . . . . . . . . . . 
        `, // Chemical waste (purple)

        img`
            . . . . . . . . . . . . . . . . 
            . . . . . . . . . . . . . . . . 
            . . . . . 3 3 3 3 3 3 . . . . . 
            . . . . 3 3 3 3 3 3 3 3 . . . . 
            . . . 3 3 3 3 3 3 3 3 3 3 . . . 
            . . 3 3 3 3 3 3 3 3 3 3 3 3 . . 
            . . 3 3 3 3 3 3 3 3 3 3 3 3 . . 
            . . 3 3 3 3 3 3 3 3 3 3 3 3 . . 
            . . 3 3 3 3 3 3 3 3 3 3 3 3 . . 
            . . 3 3 3 3 3 3 3 3 3 3 3 3 . . 
            . . 3 3 3 3 3 3 3 3 3 3 3 3 . . 
            . . . 3 3 3 3 3 3 3 3 3 3 . . . 
            . . . . 3 3 3 3 3 3 3 3 . . . . 
            . . . . . 3 3 3 3 3 3 . . . . . 
            . . . . . . . . . . . . . . . . 
            . . . . . . . . . . . . . . . . 
        `  // Battery acid (orange)
    ]

    // Define safe and dangerous areas (player starting zone)
    const playerSafeZone = { left: 45, right: 115, top: 110, bottom: 125 }

    // Get current recyclable positions to avoid
    const recyclableZones: { left: number, right: number, top: number, bottom: number }[] = []
    for (let recyclable of recyclableSprites) {
        recyclableZones.push({
            left: recyclable.x - 15,
            right: recyclable.x + 15,
            top: recyclable.y - 15,
            bottom: recyclable.y + 15
        })
    }

    // Define ALL possible hazard positions
    const allPossiblePositions = [
        // Ground level positions
        { x: 25, y: 115, moving: Math.percentChance(60) },
        { x: 135, y: 115, moving: Math.percentChance(60) },
        { x: 30, y: 115, moving: Math.percentChance(60) },
        { x: 130, y: 115, moving: Math.percentChance(60) },

        // Mid-level positions
        { x: 50, y: 105, moving: Math.percentChance(70) },
        { x: 110, y: 105, moving: Math.percentChance(70) },
        { x: 60, y: 95, moving: Math.percentChance(70) },
        { x: 100, y: 95, moving: Math.percentChance(70) },

        // Upper level positions
        { x: 70, y: 75, moving: Math.percentChance(80) },
        { x: 90, y: 75, moving: Math.percentChance(80) },
        { x: 65, y: 65, moving: Math.percentChance(80) },
        { x: 95, y: 65, moving: Math.percentChance(80) }
    ]

    // Filter out positions that conflict with safe zones or recyclables
    let validPositions: { x: number, y: number, moving: boolean }[] = []
    for (let pos of allPossiblePositions) {
        let isValid = true

        // Check player safe zone
        if (pos.x > playerSafeZone.left && pos.x < playerSafeZone.right &&
            pos.y > playerSafeZone.top && pos.y < playerSafeZone.bottom) {
            isValid = false
        }

        // Check recyclable zones
        if (isValid) {
            for (let zone of recyclableZones) {
                if (pos.x > zone.left && pos.x < zone.right &&
                    pos.y > zone.top && pos.y < zone.bottom) {
                    isValid = false
                    break
                }
            }
        }

        if (isValid) {
            validPositions.push(pos)
        }
    }

    // Determine number of hazards based on level
    let numberOfHazards: number
    if (level === 1) {
        numberOfHazards = Math.randomRange(2, 3) // Level 1: 2-3 hazards
    } else if (level === 2) {
        numberOfHazards = Math.randomRange(3, 4) // Level 2: 3-4 hazards
    } else {
        numberOfHazards = Math.randomRange(4, 5) // Level 3+: 4-5 hazards
    }

    // Ensure we don't select more than available positions
    numberOfHazards = Math.min(numberOfHazards, validPositions.length)

    // Select random positions - FIXED: Manual array copy
    let selectedPositions: { x: number, y: number, moving: boolean }[] = []

    // Create a manual copy of validPositions
    let tempPositions: { x: number, y: number, moving: boolean }[] = []
    for (let i = 0; i < validPositions.length; i++) {
        tempPositions.push(validPositions[i])
    }

    while (selectedPositions.length < numberOfHazards && tempPositions.length > 0) {
        let randomIndex = Math.randomRange(0, tempPositions.length - 1)
        selectedPositions.push(tempPositions[randomIndex])
        tempPositions.splice(randomIndex, 1)
    }

    // Create hazards
    for (let pos of selectedPositions) {
        let hazardType = hazardTypes[Math.randomRange(0, hazardTypes.length - 1)]
        createHazard(pos.x, pos.y, hazardType, pos.moving, true) // true = can relocate
    }

    console.log("Level " + level + ": Created " + hazards.length + " hazards")
}

/**
 * Find a new position for a hazard when player takes damage
 * @param hazard The hazard to relocate
 * @returns New position or null if no valid position found
 */
function findNewHazardPosition(hazard: Sprite): { x: number, y: number } | null {
    const playerSafeZone = { left: 45, right: 115, top: 110, bottom: 125 }

    // Get current recyclable and hazard positions to avoid
    const occupiedZones: { left: number, right: number, top: number, bottom: number }[] = []

    // Avoid recyclables
    for (let recyclable of recyclableSprites) {
        occupiedZones.push({
            left: recyclable.x - 15,
            right: recyclable.x + 15,
            top: recyclable.y - 15,
            bottom: recyclable.y + 15
        })
    }

    // Avoid other hazards
    for (let otherHazard of hazards) {
        if (otherHazard !== hazard) {
            occupiedZones.push({
                left: otherHazard.x - 20,
                right: otherHazard.x + 20,
                top: otherHazard.y - 20,
                bottom: otherHazard.y + 20
            })
        }
    }

    // Define possible new positions (different from original)
    const possibleNewPositions = [
        { x: 25, y: 115 }, { x: 135, y: 115 }, { x: 30, y: 115 }, { x: 130, y: 115 },
        { x: 50, y: 105 }, { x: 110, y: 105 }, { x: 60, y: 95 }, { x: 100, y: 95 },
        { x: 70, y: 75 }, { x: 90, y: 75 }, { x: 65, y: 65 }, { x: 95, y: 65 }
    ]

    // Filter valid positions - FIXED: Manual filtering
    let validPositions: { x: number, y: number }[] = []

    for (let pos of possibleNewPositions) {
        let isValid = true

        // Check player safe zone
        if (pos.x > playerSafeZone.left && pos.x < playerSafeZone.right &&
            pos.y > playerSafeZone.top && pos.y < playerSafeZone.bottom) {
            isValid = false
        }

        // Check occupied zones
        if (isValid) {
            for (let zone of occupiedZones) {
                if (pos.x > zone.left && pos.x < zone.right &&
                    pos.y > zone.top && pos.y < zone.bottom) {
                    isValid = false
                    break
                }
            }
        }

        // Don't relocate to original position
        if (isValid && hazard.data.originalPosition &&
            pos.x === hazard.data.originalPosition.x &&
            pos.y === hazard.data.originalPosition.y) {
            isValid = false
        }

        if (isValid) {
            validPositions.push(pos)
        }
    }

    // Return a random valid position
    if (validPositions.length > 0) {
        return validPositions[Math.randomRange(0, validPositions.length - 1)]
    }

    return null
}

/**
 * Create a single hazard with specified properties
 * @param x X coordinate
 * @param y Y coordinate
 * @param image Sprite image
 * @param isMoving Whether hazard moves horizontally
 * @param canRelocate Whether hazard can be relocated when hit
 */
function createHazard(x: number, y: number, image: Image, isMoving: boolean, canRelocate: boolean) {
    let hazard = sprites.create(image, SpriteKind.Hazard)
    hazard.setPosition(x, y)
    hazard.z = 5

    // Store relocation capability
    hazard.data = {
        canRelocate: canRelocate,
        originalPosition: { x: x, y: y }
    }

    // Set up movement if hazard is moving type
    if (isMoving) {
        // Different movement patterns based on hazard type
        let speed = Math.randomRange(25, 40)
        let movementRange = Math.randomRange(20, 35)

        // Determine which hazard type this is by checking array reference
        let hazardIndex = -1
        for (let i = 0; i < hazardTypes.length; i++) {
            // Compare by checking if it's the same image in the array
            if (image === hazardTypes[i]) {
                hazardIndex = i
                break
            }
        }

        // Adjust speed based on hazard type
        if (hazardIndex === 0) { // Chemical barrel - slower
            speed = Math.randomRange(20, 30)
        } else if (hazardIndex === 1) { // Battery acid - faster
            speed = Math.randomRange(30, 45)
        }

        hazard.vx = speed
        if (Math.percentChance(50)) {
            hazard.vx = -hazard.vx
        }

        hazard.data.minX = Math.max(20, x - movementRange)
        hazard.data.maxX = Math.min(140, x + movementRange)
        hazard.data.startX = x
        hazard.data.avoidZone = { left: 45, right: 115 }
    }

    hazards.push(hazard)
    createHazardEffects()
}

/**
 * Create the recycling bin goal
 */
function createGoal() {
    // Create a proper recycling bin structure
    goal = sprites.create(img`
        . . . . . . . . . . . . . . . . 
        . . . . . . . . . . . . . . . . 
        . . . . . . . . . . . . . . . . 
        . . . . . . . . . . . . . . . . 
        . . . . 8 8 8 8 8 8 8 8 . . . . 
        . . . 8 8 8 8 8 8 8 8 8 8 . . . 
        . . 8 8 8 8 8 8 8 8 8 8 8 8 . . 
        . . 8 8 8 8 8 8 8 8 8 8 8 8 . . 
        . . 8 8 8 8 8 8 8 8 8 8 8 8 . . 
        . . 8 8 8 8 8 8 8 8 8 8 8 8 . . 
        . . 8 8 8 8 8 8 8 8 8 8 8 8 . . 
        . . 8 8 8 8 8 8 8 8 8 8 8 8 . . 
        . . 8 8 8 8 8 8 8 8 8 8 8 8 . . 
        . . 8 8 8 8 8 8 8 8 8 8 8 8 . . 
        . . 8 8 8 8 8 8 8 8 8 8 8 8 . . 
        . . 8 8 8 8 8 8 8 8 8 8 8 8 . . 
    `, SpriteKind.Goal)

    // Make the goal MORE VISIBLE and accessible
    console.log("=== PLACING GOAL ===")

    // Try to find a good platform - prioritize visibility
    let allPlatforms = sprites.allOfKind(SpriteKind.Wall)
    let bestPlatform: Sprite = null

    // Look for platforms in this priority:
    // 1. Upper platforms that are easily visible
    // 2. Middle platforms 
    // 3. Ground platform as last resort

    for (let platform of allPlatforms) {
        // Skip boundaries and very small platforms
        if (platform.width < 20 || platform.height < 3) continue

        console.log("Platform at (" + platform.x + ", " + platform.y + ") size: " + platform.width + "x" + platform.height)

        // Prefer platforms in the upper half of the screen
        if (platform.y < 80) {
            bestPlatform = platform
            console.log("Found upper platform!")
            break
        }

        // Otherwise keep looking
        if (!bestPlatform || platform.y < bestPlatform.y) {
            bestPlatform = platform
        }
    }

    if (bestPlatform) {
        goal.x = bestPlatform.x
        goal.y = bestPlatform.top - (goal.height / 2)
        console.log("Goal placed on platform at (" + goal.x + ", " + goal.y + ")")
    } else {
        // Fallback position - CENTER and VISIBLE
        goal.setPosition(80, 60)
        console.log("Goal placed at CENTER position (80, 60)")
    }

    goal.z = 10  // Higher z-index to ensure it's on top
    goalActive = false

    // Add a visible outline or effect to make it stand out
    goal.startEffect(effects.bubbles, 500)

    console.log("Goal FINAL position: (" + goal.x + ", " + goal.y + ") - Active: " + goalActive)

    // Debug: Draw a temporary circle around the goal location
    let marker = sprites.create(img`
        . . . . . . . . . . . . . . . . 
        . . . . . . 7 7 7 7 . . . . . . 
        . . . . 7 7 7 7 7 7 7 7 . . . . 
        . . . 7 7 7 . . . . 7 7 7 . . . 
        . . 7 7 7 . . . . . . 7 7 7 . . 
        . . 7 7 . . . . . . . . 7 7 . . 
        . 7 7 7 . . . . . . . . 7 7 7 . 
        . 7 7 . . . . . . . . . . 7 7 . 
        . 7 7 . . . . . . . . . . 7 7 . 
        . 7 7 7 . . . . . . . . 7 7 7 . 
        . . 7 7 . . . . . . . . 7 7 . . 
        . . 7 7 7 . . . . . . 7 7 7 . . 
        . . . 7 7 7 . . . . 7 7 7 . . . 
        . . . . 7 7 7 7 7 7 7 7 . . . . 
        . . . . . . 7 7 7 7 . . . . . . 
        . . . . . . . . . . . . . . . . 
    `, SpriteKind.Effect)
    marker.setPosition(goal.x, goal.y)
    marker.z = 11
    marker.lifespan = 3000  // Remove after 3 seconds

    console.log("Goal marker placed at (" + goal.x + ", " + goal.y + ")")
}

/**
 * Activate the goal when enough recyclables are collected
 */
function activateGoal() {
    // Create goal FIRST
    createGoal()
    console.log("ACTIVATE GOAL CALLED! Recyclables: " + recyclablesCollected + "/" + recyclablesNeeded)
    goalActive = true

    // Change bin color to green when active
    goal.setImage(img`
        . . . . . . . . . . . . . . . . 
        . . . . . . . . . . . . . . . . 
        . . . . . . . . . . . . . . . . 
        . . . . . . . . . . . . . . . . 
        . . . . 2 2 2 2 2 2 2 2 . . . . 
        . . . 2 2 2 2 2 2 2 2 2 2 . . . 
        . . 2 2 2 2 2 2 2 2 2 2 2 2 . . 
        . . 2 2 2 2 2 2 2 2 2 2 2 2 . . 
        . . 2 2 2 2 2 2 2 2 2 2 2 2 . . 
        . . 2 2 2 2 2 2 2 2 2 2 2 2 . . 
        . . 2 2 2 2 2 2 2 2 2 2 2 2 . . 
        . . 2 2 2 2 2 2 2 2 2 2 2 2 . . 
        . . 2 2 2 2 2 2 2 2 2 2 2 2 . . 
        . . 2 2 2 2 2 2 2 2 2 2 2 2 . . 
        . . 2 2 2 2 2 2 2 2 2 2 2 2 . . 
        . . 2 2 2 2 2 2 2 2 2 2 2 2 . . 
    `)

    // Visual feedback - make bin glow and pulse
    goal.startEffect(effects.fire, 1000)

    // Add floating particles around the active bin
    createGoalActivationEffect(goal.x, goal.y)

    // Show unlock message
    game.showLongText("♻️ Recycling Bin UNLOCKED! ♻️\n\nHead to the green bin to complete your mission!", DialogLayout.Bottom)
    console.log("Recycling Bin activated and ready!")
}

/**
 * Create visual effects when goal is activated
 * @param x X coordinate for effect center
 * @param y Y coordinate for effect center
 */
function createGoalActivationEffect(x: number, y: number) {
    for (let i = 0; i < 8; i++) {
        let particle = sprites.create(img`
            . . . . . . . . . . . . . . . . 
            . . . . . . . . . . . . . . . . 
            . . . . . . 2 2 . . . . . . . . 
            . . . . . 2 2 2 2 . . . . . . . 
            . . . . . 2 2 2 2 . . . . . . . 
            . . . . . . 2 2 . . . . . . . . 
            . . . . . . . . . . . . . . . . 
            . . . . . . . . . . . . . . . . 
        `, SpriteKind.Effect)
        particle.setPosition(x, y)

        // Circular particle movement around the bin
        let angle = i * 45
        let radius = 12
        particle.vx = Math.cos(angle * Math.PI / 180) * 20
        particle.vy = Math.sin(angle * Math.PI / 180) * 20

        particle.lifespan = 1500
        particle.z = 4 // Below player but above platforms
    }
}

/**
 * Set up hazard collision detection
 */
function setupHazardOverlap() {
    sprites.onOverlap(SpriteKind.Player, SpriteKind.Hazard, function (player, hazard) {
        if (isGameOver) return // Don't process if game over

        takeDamage(hazard) // Pass the hazard to the function
    })
}

/**
 * Create animated visual effects for hazards
 */
function createHazardEffects() {
    for (let hazard of hazards) {
        // Add pulsing effect to hazards
        if (Math.percentChance(70)) {
            hazard.startEffect(effects.halo, 2000)
        }

        // Add occasional smoke/bubble effects
        if (Math.percentChance(30)) {
            hazard.startEffect(effects.bubbles, 1500)
        }
    }
}

/**
 * Create collection effect when player collects recyclable
 * @param x X coordinate for effect
 * @param y Y coordinate for effect
 */
function createCollectionEffect(x: number, y: number) {
    for (let i = 0; i < 3; i++) {
        let particle = sprites.create(img`
            . . . . . . . . . . . . . . . . 
            . . . . . . . . . . . . . . . . 
            . . . . . . 4 4 . . . . . . . . 
            . . . . . 4 4 4 4 . . . . . . . 
            . . . . . 4 4 4 4 . . . . . . . 
            . . . . . . 4 4 . . . . . . . . 
            . . . . . . . . . . . . . . . . 
            . . . . . . . . . . . . . . . . 
        `, SpriteKind.Effect)
        particle.setPosition(x, y)
        particle.vx = Math.randomRange(-30, 30)
        particle.vy = Math.randomRange(-30, -10)
        particle.lifespan = 500
        particle.ay = 50 // Gravity for particles
    }
}

/**
 * Set up recyclable collection system
 */
function setupCollectionOverlap() {
    sprites.onOverlap(SpriteKind.Player, SpriteKind.Recyclable, function (player, recyclable) {
        // Collect the recyclable
        recyclable.destroy()
        recyclablesCollected++

        // Play sound effect
        collectionEffect.play(1)

        // Create visual effect
        createCollectionEffect(recyclable.x, recyclable.y)

        // Update score
        updateScore()

        // Remove from our tracking array
        let index = recyclableSprites.indexOf(recyclable)
        if (index > -1) {
            recyclableSprites.splice(index, 1)
        }

        console.log("Collected recyclable! Total: " + recyclablesCollected + "/" + recyclablesNeeded)

        // Check if goal should be activated
        updateGoalStatus()
    })
}

/**
 * Check if level is complete (legacy function)
 */
function checkLevelCompletion() {
    if (recyclablesCollected >= recyclablesNeeded) {
        game.showLongText("Level Complete! You recycled " + recyclablesCollected + " items!", DialogLayout.Bottom)
        // We'll add level progression in the next step
    }
}

/**
 * Position player on a safe platform at level start
 */
function positionPlayerOnPlatform() {
    // Find the main ground platform (the wide one at the bottom)
    let groundPlatform = sprites.allOfKind(SpriteKind.Wall).find(p => p.width > 50 && p.y > 100)

    if (groundPlatform) {
        // Position player on top of the ground platform - CENTER for maximum safety
        player.x = groundPlatform.x
        player.y = groundPlatform.top - (player.height / 2)
        console.log("Player started on main ground platform at center")
    } else {
        // Fallback to center position
        player.setPosition(80, 60)
        console.log("Player started at center fallback")
    }

    // Player starts on ground
    isOnGround = true
    currentPlatform = null // Not on a moving platform initially
}

/**
 * Set up player control inputs
 */
function setupPlayerControls() {
    // Horizontal movement
    controller.left.onEvent(ControllerButtonEvent.Pressed, function () {
        player.vx = -playerSpeed
    })

    controller.right.onEvent(ControllerButtonEvent.Pressed, function () {
        player.vx = playerSpeed
    })

    controller.left.onEvent(ControllerButtonEvent.Released, function () {
        if (!controller.right.isPressed()) {
            player.vx = 0
        }
    })

    controller.right.onEvent(ControllerButtonEvent.Released, function () {
        if (!controller.left.isPressed()) {
            player.vx = 0
        }
    })

    // Jumping - WITH FORGIVENESS (allows jumping shortly after leaving platform)
    controller.A.onEvent(ControllerButtonEvent.Pressed, function () {
        if (isOnGround || jumpForgivenessFrames > 0) {
            player.vy = -jumpPower
            isOnGround = false
            currentPlatform = null
            jumpForgivenessFrames = 0 // Use up the forgiveness
            console.log("Jump! Ground: " + isOnGround + " Forgiveness: " + jumpForgivenessFrames)
        }
    })
}

/**
 * Set up collision detection (handled in main game loop)
 */
function setupCollisions() {
    // This is handled in the main game loop now
}

/**
 * Handle player taking damage from hazards
 * @param hazard The hazard that damaged the player
 */
function takeDamage(hazard: Sprite) {
    lives--
    hazardSound.play(1)

    // Visual feedback
    player.startEffect(effects.disintegrate, 500)

    // Relocate the hazard instead of destroying it
    if (hazard.data && hazard.data.canRelocate) {
        relocateHazard(hazard)
    } else {
        // For hazards that can't relocate (future use)
        removeHazard(hazard)
    }

    // Update lives display
    updateLivesDisplay()

    console.log("Player hit hazard! Lives: " + lives + " Hazards remaining: " + hazards.length)

    // Reset player position
    resetPlayer()

    // Check for game over
    if (lives <= 0) {
        gameOver()
    }
}

/**
 * Relocate a hazard to a new position
 * @param hazard The hazard to relocate
 */
function relocateHazard(hazard: Sprite) {
    // Create relocation effect
    createHazardRelocationEffect(hazard.x, hazard.y)

    // Find a new valid position
    let newPosition = findNewHazardPosition(hazard)

    if (newPosition) {
        // Move hazard to new position
        hazard.x = newPosition.x
        hazard.y = newPosition.y

        // Reset movement if it was moving
        if (hazard.data.minX !== undefined) {
            hazard.data.minX = Math.max(20, newPosition.x - 25)
            hazard.data.maxX = Math.min(140, newPosition.x + 25)
            hazard.data.startX = newPosition.x

            // Randomize direction again
            hazard.vx = Math.randomRange(25, 40)
            if (Math.percentChance(50)) {
                hazard.vx = -hazard.vx
            }
        }

        console.log("Hazard relocated to (" + newPosition.x + ", " + newPosition.y + ")")
    } else {
        // If no valid position found, remove the hazard
        removeHazard(hazard)
        console.log("No valid position found - hazard removed")
    }
}

/**
 * Remove a hazard from the game
 * @param hazard The hazard to remove
 */
function removeHazard(hazard: Sprite) {
    // Create destruction effect
    createHazardDestructionEffect(hazard.x, hazard.y)

    // Remove from hazards array
    let index = hazards.indexOf(hazard)
    if (index > -1) {
        hazards.splice(index, 1)
    }

    // Destroy the sprite
    hazard.destroy()
}

/**
 * Create visual effect when hazard is destroyed
 * @param x X coordinate for effect
 * @param y Y coordinate for effect
 */
function createHazardDestructionEffect(x: number, y: number) {
    for (let i = 0; i < 6; i++) {
        let particle = sprites.create(img`
            . . . . . . . . . . . . . . . . 
            . . . . . . . . . . . . . . . . 
            . . . . . . 7 7 . . . . . . . . 
            . . . . . 7 7 7 7 . . . . . . . 
            . . . . . 7 7 7 7 . . . . . . . 
            . . . . . . 7 7 . . . . . . . . 
            . . . . . . . . . . . . . . . . 
            . . . . . . . . . . . . . . . . 
        `, SpriteKind.Effect)
        particle.setPosition(x, y)
        particle.vx = Math.randomRange(-40, 40)
        particle.vy = Math.randomRange(-40, -20)
        particle.lifespan = 400
        particle.ay = 80 // Gravity for particles

        // Color particles based on hazard type
        if (Math.percentChance(50)) {
            particle.image.fill(7) // Purple particles
        } else {
            particle.image.fill(3) // Orange particles
        }
    }
}

/**
 * Create relocation effect for hazards
 * @param x X coordinate for effect
 * @param y Y coordinate for effect
 */
function createHazardRelocationEffect(x: number, y: number) {
    for (let i = 0; i < 4; i++) {
        let particle = sprites.create(img`
            . . . . . . . . . . . . . . . . 
            . . . . . . . . . . . . . . . . 
            . . . . . . 1 1 . . . . . . . . 
            . . . . . 1 1 1 1 . . . . . . . 
            . . . . . 1 1 1 1 . . . . . . . 
            . . . . . . 1 1 . . . . . . . . 
            . . . . . . . . . . . . . . . . 
            . . . . . . . . . . . . . . . . 
        `, SpriteKind.Effect)
        particle.setPosition(x, y)
        particle.vx = Math.randomRange(-35, 35)
        particle.vy = Math.randomRange(-35, -15)
        particle.lifespan = 300
        particle.ay = 60
        particle.image.fill(10) // Yellow particles for relocation
    }
}

/**
 * Handle game over state
 */
function gameOver() {
    isGameOver = true
    gameOverSound.play(1)

    // Show game over message
    game.showLongText("Game Over!\nFinal Score: " + score + "\nItems Recycled: " + recyclablesCollected, DialogLayout.Bottom)

    // Stop all movement
    player.vx = 0
    player.vy = 0

    // You could add a "Press A to restart" here later
    console.log("Game Over - Final Score: " + score)
}

/**
 * Complete the current level and show results
 */
function completeLevel() {
    // Prevent multiple triggers
    if (isLevelComplete || isGameOver) return

    // Set flags to prevent repeated calls
    isLevelComplete = true
    isGameOver = true

    levelUpSound.play(1)

    // Calculate level score bonus
    let livesBonus = lives * 50
    let hazardBonus = (hazards.length === 0) ? 100 : 0
    let levelBonus = level * 25

    currentLevelScore = score + livesBonus + hazardBonus + levelBonus

    // Show level completion message
    let bonusText = ""
    if (hazards.length === 0) {
        bonusText = "\nHazard Clear Bonus: +100"
    }
    if (livesBonus > 0) {
        bonusText += "\nLives Bonus: +" + livesBonus
    }

    game.showLongText(
        "Level " + level + " Complete!\n" +
        "Recycled: " + recyclablesCollected + "/" + recyclablesNeeded + " items\n" +
        "Score: " + score + bonusText + "\n" +
        "Total: " + currentLevelScore + " points!\n\n" +
        "Press A for next level",
        DialogLayout.Bottom
    )

    // Set up one-time A button press
    controller.A.onEvent(ControllerButtonEvent.Pressed, function () {
        if (isLevelComplete) {
            isLevelComplete = false
            isGameOver = false
            nextLevel()
        }
    })
}

/**
 * Reset player position after taking damage or falling
 */
function resetPlayer() {
    // Stop all movement first
    player.vx = 0
    player.vy = 0

    // Find the safest platform to respawn on (prioritize ground)
    let groundPlatform = sprites.allOfKind(SpriteKind.Wall).find(p => p.width > 50 && p.y > 100)

    if (groundPlatform) {
        player.x = groundPlatform.x
        player.y = groundPlatform.top - (player.height / 2)
        console.log("Player respawned on ground platform")
    } else {
        // Fallback to center top position
        player.setPosition(80, 30)
        console.log("Player respawned at center fallback")
    }

    isOnGround = true
    currentPlatform = null
}

/**
 * Check if player is standing on any platform
 */
function checkPlatformCollisions() {
    let wasOnGround = isOnGround
    isOnGround = false
    currentPlatform = null

    // Check all platforms (both static and moving)
    let allPlatforms = sprites.allOfKind(SpriteKind.Wall).concat(sprites.allOfKind(SpriteKind.MovingPlatform))

    for (let platform of allPlatforms) {
        if (player.overlapsWith(platform)) {
            // Check if player is landing on top of platform
            if (player.vy >= 0 && Math.abs(player.bottom - platform.top) < 8) { // Increased tolerance from 5 to 8
                // Land on platform
                player.y = platform.top - (player.height / 2)
                player.vy = 0
                isOnGround = true
                currentPlatform = platform
                jumpForgivenessFrames = MAX_JUMP_FORGIVENESS // Reset forgiveness when on ground
                break
            }
        }
    }

    // If we just left ground, give some jump forgiveness
    if (wasOnGround && !isOnGround) {
        jumpForgivenessFrames = MAX_JUMP_FORGIVENESS
    }
}

/**
 * Update player position when on moving platform
 */
function updatePlayerOnMovingPlatform() {
    if (isOnGround && currentPlatform && currentPlatform.kind() == SpriteKind.MovingPlatform) {
        // Move player with the platform - but preserve player's own horizontal input
        // Don't override player.vx completely, just add platform movement
        player.x += currentPlatform.vx * 0.1
    }
}

/**
 * Update goal activation status based on recyclables collected
 */
function updateGoalStatus() {
    console.log("updateGoalStatus called - Collected: " + recyclablesCollected + "/" + recyclablesNeeded)

    if (recyclablesCollected >= recyclablesNeeded && !goalActive) {
        console.log("✅ CONDITIONS MET! Activating goal...")
        goalActive = true
        activateGoal()
    } else if (recyclablesCollected >= recyclablesNeeded) {
        console.log("✅ Goal should be active but isn't? goalActive=" + goalActive)
    } else {
        console.log("❌ Not enough recyclables: " + recyclablesCollected + "/" + recyclablesNeeded)
    }
}

/**
 * Set up goal overlap detection with protection against multiple triggers
 */
function setupGoalOverlap() {
    sprites.onOverlap(SpriteKind.Player, SpriteKind.Goal, function (player, goal) {
        if (isGameOver || isLevelComplete) return

        console.log("Player reached goal. Goal active: " + goalActive)
        console.log("Recyclables collected: " + recyclablesCollected + "/" + recyclablesNeeded)

        if (goalActive) {
            console.log("Level complete triggered!")
            completeLevel()
        } else {
            let missing = recyclablesNeeded - recyclablesCollected
            console.log("Goal locked. Missing: " + missing + " recyclables")

            if (missing === 1) {
                game.showLongText("Need 1 more recyclable!", DialogLayout.Bottom)
            } else {
                game.showLongText("Need " + missing + " more recyclables", DialogLayout.Bottom)
            }
        }
    })
}

/**
 * Create decorative background elements (clouds)
 */
function createBackgroundElements() {
    // Create multiple clouds that will loop
    for (let i = 0; i < 4; i++) {
        createCloud(i * 40 + 20, Math.randomRange(20, 40))
    }
}

/**
 * Create a single cloud with looping behavior
 * @param startX Starting X position
 * @param y Y position
 */
function createCloud(startX: number, y: number) {
    let cloud = sprites.create(img`
        . . . . . . . . . . . . . . . . 
        . . . . . . . . . . . . . . . . 
        . . . 1 1 1 1 1 1 . . . . . . . 
        . . 1 1 1 1 1 1 1 1 1 . . . . . 
        . 1 1 1 1 1 1 1 1 1 1 1 . . . . 
        1 1 1 1 1 1 1 1 1 1 1 1 1 . . . 
        1 1 1 1 1 1 1 1 1 1 1 1 1 1 . . 
        . 1 1 1 1 1 1 1 1 1 1 1 1 1 . . 
        . . 1 1 1 1 1 1 1 1 1 1 1 . . . 
        . . . . . . . . . . . . . . . . 
        . . . . . . . . . . . . . . . . 
        . . . . . . . . . . . . . . . . 
        . . . . . . . . . . . . . . . . 
        . . . . . . . . . . . . . . . . 
        . . . . . . . . . . . . . . . . 
        . . . . . . . . . . . . . . . . 
    `, SpriteKind.Background)
    cloud.setPosition(startX, y)
    cloud.z = -10
    cloud.vx = Math.randomRange(-8, -3)
    clouds.push(cloud)
}

/**
 * Create the platform layout for the level
 */
function createPlatforms() {
    // Ground platform (the main floor) - static
    createPlatform(80, 120, 80, 8, 2, false)

    // Moving platforms - KEEP THEM WITHIN VISIBLE AREA
    createPlatform(50, 90, 40, 6, 2, true)   // Left platform that moves (moved from 40 to 50)
    createPlatform(110, 70, 40, 6, 2, true)  // Right platform that moves (moved from 120 to 110)
    createPlatform(80, 50, 30, 4, 2, true)   // High center platform that moves

    // Small static platforms for jumping challenges
    createPlatform(30, 110, 20, 3, 2, false)  // Low left - static (moved from 15 to 30)
    createPlatform(130, 100, 20, 3, 2, false) // Low right - static (moved from 140 to 130)
}

/**
 * Helper function to create platforms
 * @param x X coordinate
 * @param y Y coordinate
 * @param width Platform width
 * @param height Platform height
 * @param tileSize Size of platform border
 * @param isMoving Whether platform moves horizontally
 */
function createPlatform(x: number, y: number, width: number, height: number, tileSize: number, isMoving: boolean) {
    let platform: Sprite

    if (isMoving) {
        platform = sprites.create(createPlatformImage(width, height, tileSize, true), SpriteKind.MovingPlatform)
        platform.setPosition(x, y)

        // Set movement properties - SLOWER and WITHIN VISIBLE AREA
        platform.vx = Math.randomRange(15, 25)  // Slower movement
        if (Math.percentChance(50)) {
            platform.vx = -platform.vx
        }

        // Store movement boundaries - KEEP WITHIN SCREEN
        platform.data = {
            minX: Math.max(20, x - 20),  // Don't go too far left
            maxX: Math.min(140, x + 20), // Don't go too far right
            startX: x
        }
    } else {
        platform = sprites.create(createPlatformImage(width, height, tileSize, false), SpriteKind.Wall)
        platform.setPosition(x, y)
    }

    platform.z = -1
}

/**
 * Create platform image based on size and type
 * @param width Platform width
 * @param height Platform height
 * @param tileSize Size of platform border
 * @param isMoving Whether platform is moving type
 * @returns Image for the platform
 */
function createPlatformImage(width: number, height: number, tileSize: number, isMoving: boolean): Image {
    let img = image.create(width, height)

    if (isMoving) {
        img.fill(8)  // Gray color for moving platforms
        for (let i = 0; i < width; i++) {
            for (let j = 0; j < tileSize; j++) {
                img.setPixel(i, j, 7)  // Dark gray top border
            }
        }
        for (let i = 2; i < width - 2; i += 4) {
            img.setPixel(i, tileSize + 1, 1)  // White dots for moving platform indicator
        }
    } else {
        img.fill(2)  // Green color for static platforms
        for (let i = 0; i < width; i++) {
            for (let j = 0; j < tileSize; j++) {
                img.setPixel(i, j, 13)  // Dark green top border
            }
        }
    }

    return img
}

/**
 * Create world boundaries (invisible walls)
 */
function createBoundaries() {
    // Use invisible boundaries
    let leftBoundary = sprites.create(img`
        1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1
        1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1
        1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1
        1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1
        1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1
        1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1
        1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1
        1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1
    `, SpriteKind.Wall)
    leftBoundary.setPosition(-8, 60)
    leftBoundary.setFlag(SpriteFlag.Invisible, true)

    let rightBoundary = sprites.create(img`
        1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1
        1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1
        1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1
        1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1
        1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1
        1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1
        1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1
        1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1
    `, SpriteKind.Wall)
    rightBoundary.setPosition(168, 60)
    rightBoundary.setFlag(SpriteFlag.Invisible, true)
}

/**
 * Set up camera system
 */
function setupCamera() {
    // Start with centered camera
    scene.centerCameraAt(80, 60)
}

/**
 * Set up UI display (lives and score)
 */
function setupUI() {
    info.setLife(lives)
    info.setScore(score)
}

/**
 * Update lives display in UI
 */
function updateLivesDisplay() {
    info.setLife(lives)
}

/**
 * Update score display in UI
 */
function updateScore() {
    score = recyclablesCollected * 10
    info.setScore(score)
}

/**
 * Progress to next level with increased difficulty
 */
function nextLevel() {
    level++

    // Increase difficulty
    recyclablesNeeded = 4 + level // More recyclables each level
    playerSpeed += 10 // Slightly faster movement
    jumpPower += 10 // Slightly higher jumps

    // Reset level-specific variables
    recyclablesCollected = 0
    score = 0
    goalActive = false
    currentLevelScore = 0
    isLevelComplete = false // Reset the completion flag
    isGameOver = false // Reset game over flag

    // Clear all game objects
    clearLevel()

    // Create new level
    createEnvironment()

    console.log("Starting Level " + level)
}

/**
 * Check win condition (for future expansion)
 */
function checkWinCondition() {
    // We'll implement this for a final win after multiple levels
    if (level > 3) { // Example: Win after 3 levels
        game.showLongText(
            "Congratulations! You've completed all levels!\n\n" +
            "You're a Recycling Champion!\n" +
            "Final Score: " + (score + currentLevelScore),
            DialogLayout.Bottom
        )
        game.over(true)
    }
}

/**
 * Clear all level objects for level transition
 */
function clearLevel() {
    // Clear recyclables
    for (let item of recyclableSprites) {
        item.destroy()
    }
    recyclableSprites = []

    // Clear hazards
    for (let hazard of hazards) {
        hazard.destroy()
    }
    hazards = []

    // Clear goal
    if (goal) {
        goal.destroy()
        goal = null
    }
}

/**
 * Main game update loop - runs every frame
 */
game.onUpdate(function () {
    // Cloud looping system
    for (let cloud of clouds) {
        if (cloud.x < -20) {
            cloud.x = 170
            cloud.y = Math.randomRange(15, 45)
        }
    }

    // Moving platform system
    for (let platform of sprites.allOfKind(SpriteKind.MovingPlatform)) {
        let data = platform.data
        if (platform.x <= data.minX || platform.x >= data.maxX) {
            platform.vx = -platform.vx
        }
    }

    // Moving hazard system
    for (let hazard of hazards) {
        if (hazard.data) { // Check if it's a moving hazard
            let data = hazard.data

            // Reverse direction at boundaries
            if (hazard.x <= data.minX || hazard.x >= data.maxX) {
                hazard.vx = -hazard.vx
            }

            // Additional protection: if hazard accidentally enters safe zone, push it out
            if (data.avoidZone && hazard.x > data.avoidZone.left && hazard.x < data.avoidZone.right) {
                if (hazard.vx > 0) {
                    hazard.x = data.avoidZone.right + 5
                } else {
                    hazard.x = data.avoidZone.left - 5
                }
                hazard.vx = -hazard.vx
            }
        }
    }

    // Occasional hazard particle effects
    if (Math.percentChance(1)) {
        let randomHazard = hazards[Math.randomRange(0, hazards.length - 1)]
        if (randomHazard) {
            createHazardParticleEffect(randomHazard.x, randomHazard.y)
        }
    }

    // Player collision detection
    checkPlatformCollisions()
    updatePlayerOnMovingPlatform()
    // Check if player has fallen out of bounds
    checkPlayerBounds()
})

/**
 * Create particle effects around hazards
 * @param x X coordinate for effect
 * @param y Y coordinate for effect
 */
function createHazardParticleEffect(x: number, y: number) {
    let particle = sprites.create(img`
        . . . . . . . . . . . . . . . . 
        . . . . . . . . . . . . . . . . 
        . . . . . . 7 7 . . . . . . . . 
        . . . . . 7 7 7 7 . . . . . . . 
        . . . . . 7 7 7 7 . . . . . . . 
        . . . . . . 7 7 . . . . . . . . 
        . . . . . . . . . . . . . . . . 
        . . . . . . . . . . . . . . . . 
    `, SpriteKind.Effect)
    particle.setPosition(x + Math.randomRange(-8, 8), y + Math.randomRange(-8, 8))
    particle.vx = Math.randomRange(-10, 10)
    particle.vy = Math.randomRange(-5, 5)
    particle.lifespan = Math.randomRange(300, 800)
    particle.z = 4
}

/**
 * Check if player has fallen out of bounds
 */
function checkPlayerBounds() {
    // If player falls below the screen (with some buffer)
    if (player.y > 130) {
        console.log("Player fell out of bounds! Player Y: " + player.y)
        takeFallDamage()
    }

    // Optional: Also check if player goes too far left/right (if your level design allows this)
    if (player.x < -10 || player.x > 170) {
        console.log("Player went out of side bounds! Player X: " + player.x)
        takeFallDamage()
    }
}

/**
 * Handle fall damage when player falls out of bounds
 */
function takeFallDamage() {
    if (isGameOver) return

    lives--
    hazardSound.play(1)

    // Visual feedback
    player.startEffect(effects.disintegrate, 500)

    // Update lives display
    updateLivesDisplay()

    console.log("Player fell! Lives: " + lives)

    // Reset player position
    resetPlayer()

    // Check for game over
    if (lives <= 0) {
        gameOver()
    }
}

// Start the game by creating the initial environment
createEnvironment()
