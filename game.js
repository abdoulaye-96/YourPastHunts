const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const width = canvas.width;
const height = canvas.height;

// Constants
const ARENA_LEFT = 50;
const ARENA_RIGHT = width - 50;
const ARENA_TOP = 50;
const ARENA_BOTTOM = height - 50;
const PLAYER_SPEED = 200; // pixels per second
const DASH_SPEED = 400;
const BULLET_SPEED = 300;
const BULLET_LIFETIME = 2; // seconds
const MAX_CLONES = 5;
const ATTACK_COOLDOWN = 0.5; // seconds
const CLONE_SEARCH_SPEED = 140;

// Game state
let player = {
    x: width / 2,
    y: height / 2,
    dir: 0, // radians
    vx: 0,
    vy: 0,
    recording: [],
    attacking: false,
    dashing: false,
    dashTime: 0,
    attackCooldown: 0,
    hp: 2
};

let clones = [];
let bullets = [];
let hazards = [
    {x: 150, y: 150, radius: 20, type: 'static'},
    {x: 650, y: 150, radius: 20, type: 'static'},
    {x: 150, y: 450, radius: 20, type: 'static'},
    {x: 650, y: 450, radius: 20, type: 'static'},
    {x: 400, y: 200, radius: 15, type: 'static'},
    {x: 400, y: 400, radius: 15, type: 'static'},
    {x: 200, y: 300, radius: 15, type: 'static'},
    {x: 600, y: 300, radius: 15, type: 'static'},
    {x: 300, y: 100, radius: 18, type: 'static'},
    {x: 500, y: 500, radius: 18, type: 'static'},
    {x: 100, y: 250, radius: 12, type: 'moving', vx: 50, vy: 0, minX: 100, maxX: 300},
    {x: 700, y: 350, radius: 12, type: 'moving', vx: -50, vy: 0, minX: 500, maxX: 700},
    {x: 250, y: 550, radius: 12, type: 'moving', vx: 0, vy: -30, minY: 350, maxY: 550},
    {x: 550, y: 50, radius: 12, type: 'moving', vx: 0, vy: 30, minY: 50, maxY: 250}
];
let walls = [
    {x: 350, y: 250, w: 100, h: 20},
    {x: 250, y: 350, w: 20, h: 100},
    {x: 550, y: 150, w: 20, h: 100}
];
let respawnPoints = [
    {x: 100, y: 100},
    {x: 700, y: 100},
    {x: 100, y: 500},
    {x: 700, y: 500}
];
let currentRespawnIndex = 0;
let score = 0;
let loopCount = 0;
let lastTime = 0;
let keys = {};

// Input handling
document.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (e.code === 'Space') e.preventDefault();
});

document.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

// Utility functions
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
}

function normalizeAngle(angle) {
    while (angle < 0) angle += 2 * Math.PI;
    while (angle >= 2 * Math.PI) angle -= 2 * Math.PI;
    return angle;
}

function collidesWithWall(entityX, entityY, radius = 10) {
    return walls.some(wall => (
        entityX + radius > wall.x &&
        entityX - radius < wall.x + wall.w &&
        entityY + radius > wall.y &&
        entityY - radius < wall.y + wall.h
    ));
}

// Update function
function update(deltaTime) {
    // Handle input
    let moveX = 0;
    let moveY = 0;
    if (keys['KeyW'] || keys['ArrowUp']) moveY = -1;
    if (keys['KeyS'] || keys['ArrowDown']) moveY = 1;
    if (keys['KeyA'] || keys['ArrowLeft']) moveX = -1;
    if (keys['KeyD'] || keys['ArrowRight']) moveX = 1;

    // Update direction
    if (moveX !== 0 || moveY !== 0) {
        player.dir = Math.atan2(moveY, moveX);
    }

    // Movement
    let speed = PLAYER_SPEED;
    if (keys['ShiftLeft'] && player.dashTime <= 0) {
        player.dashing = true;
        player.dashTime = 0.2; // dash duration
        speed = DASH_SPEED;
    }
    if (player.dashing) {
        speed = DASH_SPEED;
        player.dashTime -= deltaTime;
        if (player.dashTime <= 0) {
            player.dashing = false;
        }
    }

    player.vx = moveX * speed;
    player.vy = moveY * speed;
    player.x += player.vx * deltaTime;
    player.y += player.vy * deltaTime;

    // Wall collision for player
    walls.forEach(wall => {
        if (player.x + 10 > wall.x && player.x - 10 < wall.x + wall.w &&
            player.y + 10 > wall.y && player.y - 10 < wall.y + wall.h) {
            // Push back
            if (player.vx > 0) player.x = wall.x - 10;
            else if (player.vx < 0) player.x = wall.x + wall.w + 10;
            if (player.vy > 0) player.y = wall.y - 10;
            else if (player.vy < 0) player.y = wall.y + wall.h + 10;
        }
    });

    // Clamp to arena
    player.x = clamp(player.x, ARENA_LEFT, ARENA_RIGHT);
    player.y = clamp(player.y, ARENA_TOP, ARENA_BOTTOM);

    // Attack
    player.attacking = false;
    if (keys['Space'] && player.attackCooldown <= 0) {
        player.attacking = true;
        player.attackCooldown = ATTACK_COOLDOWN;
        bullets.push({
            x: player.x,
            y: player.y,
            vx: Math.cos(player.dir) * BULLET_SPEED,
            vy: Math.sin(player.dir) * BULLET_SPEED,
            owner: 'player',
            lifetime: BULLET_LIFETIME
        });
    }
    player.attackCooldown -= deltaTime;

    // Record state
    player.recording.push({
        x: player.x,
        y: player.y,
        dir: player.dir,
        attacking: player.attacking
    });

    // Update clones
    clones.forEach(clone => {
        if (clone.index < clone.recording.length) {
            const state = clone.recording[clone.index];
            clone.x = state.x;
            clone.y = state.y;
            clone.dir = state.dir;
            if (state.attacking) {
                bullets.push({
                    x: clone.x,
                    y: clone.y,
                    vx: Math.cos(clone.dir) * BULLET_SPEED,
                    vy: Math.sin(clone.dir) * BULLET_SPEED,
                    owner: 'clone',
                    lifetime: BULLET_LIFETIME
                });
            }
            clone.index++;
            return;
        }

        const dx = player.x - clone.x;
        const dy = player.y - clone.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 0) {
            clone.dir = Math.atan2(dy, dx);
            const step = Math.min(CLONE_SEARCH_SPEED * deltaTime, dist);
            const nextX = clone.x + Math.cos(clone.dir) * step;
            const nextY = clone.y + Math.sin(clone.dir) * step;

            if (!collidesWithWall(nextX, clone.y)) {
                clone.x = nextX;
            }
            if (!collidesWithWall(clone.x, nextY)) {
                clone.y = nextY;
            }
        }

        clone.x = clamp(clone.x, ARENA_LEFT, ARENA_RIGHT);
        clone.y = clamp(clone.y, ARENA_TOP, ARENA_BOTTOM);
    });

    // Update bullets
    bullets.forEach((bullet, i) => {
        bullet.x += bullet.vx * deltaTime;
        bullet.y += bullet.vy * deltaTime;
        bullet.lifetime -= deltaTime;
        if (bullet.lifetime <= 0 ||
            bullet.x < 0 || bullet.x > width ||
            bullet.y < 0 || bullet.y > height) {
            bullets.splice(i, 1);
        }
    });

    // Update moving hazards
    hazards.forEach(hazard => {
        if (hazard.type === 'moving') {
            hazard.x += hazard.vx * deltaTime;
            hazard.y += hazard.vy * deltaTime;
            if (hazard.vx !== 0) {
                if (hazard.x <= hazard.minX || hazard.x >= hazard.maxX) {
                    hazard.vx = -hazard.vx;
                }
            }
            if (hazard.vy !== 0) {
                if (hazard.y <= hazard.minY || hazard.y >= hazard.maxY) {
                    hazard.vy = -hazard.vy;
                }
            }
        }
    });

    // Check collisions
    bullets.forEach((bullet, i) => {
        if (bullet.owner === 'clone' && distance(bullet, player) < 10) {
            // Player takes damage
            player.hp--;
            if (player.hp <= 0) {
                die(player.recording);
            }
            bullets.splice(i, 1);
        } else if (bullet.owner === 'player') {
            clones.forEach((clone, j) => {
                if (distance(bullet, clone) < 10) {
                    // Remove clone
                    clones.splice(j, 1);
                    bullets.splice(i, 1);
                }
            });
        }
    });

    // Check clone contact
    clones.forEach(clone => {
        if (distance(clone, player) < 20) {
            // Player takes damage from contact
            player.hp--;
            if (player.hp <= 0) {
                die(player.recording);
            }
            // Push player away slightly
            const dx = player.x - clone.x;
            const dy = player.y - clone.y;
            const dist = Math.hypot(dx, dy);
            if (dist > 0) {
                player.x += (dx / dist) * 5;
                player.y += (dy / dist) * 5;
            }
        }
    });

    // Check hazard contact
    hazards.forEach(hazard => {
        if (distance(hazard, player) < hazard.radius + 10) {
            // Player takes damage from hazard
            player.hp--;
            if (player.hp <= 0) {
                die(player.recording);
            }
            // Push player away
            const dx = player.x - hazard.x;
            const dy = player.y - hazard.y;
            const dist = Math.hypot(dx, dy);
            if (dist > 0) {
                player.x += (dx / dist) * 5;
                player.y += (dy / dist) * 5;
            }
        }
    });

    // Update score
    score += deltaTime;
}

// Die function
function die(recording) {
    // Create clone at current player position (death position)
    if (clones.length < MAX_CLONES) {
        const firstState = recording[0];
        clones.push({
            recording: [...recording],
            index: 0,
            x: player.x,
            y: player.y,
            dir: firstState ? firstState.dir : player.dir,
            vx: 0,
            vy: 0
        });
    }
    // Respawn player at next safe location
    player.x = respawnPoints[currentRespawnIndex].x;
    player.y = respawnPoints[currentRespawnIndex].y;
    currentRespawnIndex = (currentRespawnIndex + 1) % respawnPoints.length;
    // Reset player
    player.hp = 2;
    player.recording = [];
    loopCount++;
}

// Draw function
function draw() {
    ctx.clearRect(0, 0, width, height);

    // Draw arena
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.strokeRect(ARENA_LEFT, ARENA_TOP, ARENA_RIGHT - ARENA_LEFT, ARENA_BOTTOM - ARENA_TOP);

    // Draw walls
    ctx.fillStyle = 'gray';
    walls.forEach(wall => {
        ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
    });

    // Draw hazards
    ctx.fillStyle = 'darkred';
    hazards.forEach(hazard => {
        ctx.beginPath();
        ctx.arc(hazard.x, hazard.y, hazard.radius, 0, 2 * Math.PI);
        ctx.fill();
    });

    // Draw player
    ctx.fillStyle = 'blue';
    ctx.beginPath();
    ctx.arc(player.x, player.y, 10, 0, 2 * Math.PI);
    ctx.fill();

    // Draw direction indicator
    ctx.strokeStyle = 'blue';
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(player.x + Math.cos(player.dir) * 15, player.y + Math.sin(player.dir) * 15);
    ctx.stroke();

    // Draw clones
    ctx.fillStyle = 'red';
    clones.forEach(clone => {
        ctx.beginPath();
        ctx.arc(clone.x, clone.y, 10, 0, 2 * Math.PI);
        ctx.fill();
        // Direction
        ctx.strokeStyle = 'red';
        ctx.beginPath();
        ctx.moveTo(clone.x, clone.y);
        ctx.lineTo(clone.x + Math.cos(clone.dir) * 15, clone.y + Math.sin(clone.dir) * 15);
        ctx.stroke();
    });

    // Draw bullets
    ctx.fillStyle = 'yellow';
    bullets.forEach(bullet => {
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, 3, 0, 2 * Math.PI);
        ctx.fill();
    });

    // Update UI
    document.getElementById('score').textContent = `Score: ${Math.floor(score)}`;
    document.getElementById('loop-count').textContent = `Loop: ${loopCount}`;
    document.getElementById('health').textContent = `Health: ${player.hp}`;
}

// Game loop
function gameLoop(currentTime) {
    const deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    update(deltaTime);
    draw();

    requestAnimationFrame(gameLoop);
}

// Start game
requestAnimationFrame(gameLoop);