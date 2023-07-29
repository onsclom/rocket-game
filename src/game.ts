const PLAYER_WIDTH = 2
const PLAYER_HEIGHT = 6
const PLAYER_ROT_SPEED = 5

const GAME_WIDTH = 100

const GRAVITY = 30
const DRAG = 0.075
const THRUST = 100

type Vector2 = [number, number]

let state = {
  player: {
    pos: [0, 0] as Vector2,
    vel: [0, 0] as Vector2,
    angle: 0,
    particles: [] as Particle[],
    particleTimer: 0,
  },
  keysDown: new Set(),
}

type Particle = {
  pos: Vector2
  vel: Vector2
  age: number
}

function fmod(a: number, b: number) {
  return Number(a - Math.floor(a / b) * b)
}

const MAX_PARTICLE_AGE = 2250
const PARTICLE_INTERVAL = 20
const PARTICLE_MAX_SIZE = 1
const PARTICLE_MAX_VEL = 4

function particle(pos: Vector2, vel: Vector2) {
  return { pos, vel, age: 0 }
}

// assumes canvas draw area is 100x100
function draw(ctx: CanvasRenderingContext2D, dt: number) {
  console.log(dt)
  ctx.fillStyle = "blue"
  ctx.fillRect(0, 0, 100, 100)
  // camera follows player
  {
    ctx.save()
    const speed = Math.sqrt(
      state.player.vel[0] * state.player.vel[0] +
        state.player.vel[1] * state.player.vel[1]
    )
    const zoom = 1.25 - speed / 500
    const HALF_CAMERA = GAME_WIDTH / zoom / 2

    ctx.scale(zoom, zoom)
    ctx.translate(
      -state.player.pos[0] + HALF_CAMERA,
      -state.player.pos[1] + HALF_CAMERA
    )

    // draw dot grid
    const topLeft = [
      state.player.pos[0] - HALF_CAMERA,
      state.player.pos[1] - HALF_CAMERA,
    ]
    const scale = 1 / zoom
    const GRID_DIMENSION = 10
    const startTranslate = [
      fmod(topLeft[0], GRID_DIMENSION),
      fmod(topLeft[1], GRID_DIMENSION),
    ]
    {
      ctx.fillStyle = "rgba(255, 255, 255, 1)"
      for (
        let y = topLeft[1] - startTranslate[1] - GRID_DIMENSION;
        y < topLeft[1] + (GAME_WIDTH + GRID_DIMENSION) * scale;
        y += GRID_DIMENSION
      ) {
        for (
          let x = topLeft[0] - startTranslate[0] - GRID_DIMENSION;
          x < topLeft[0] + (GAME_WIDTH + GRID_DIMENSION) * scale;
          x += GRID_DIMENSION
        ) {
          ctx.beginPath()
          ctx.arc(x, y, 0.5, 0, 2 * Math.PI)
          ctx.fill()
        }
      }
    }

    // draw particles
    {
      for (const particle of state.player.particles) {
        const [x, y] = particle.pos
        const size = PARTICLE_MAX_SIZE * (1 - particle.age / MAX_PARTICLE_AGE)
        const transparency = 1
        ctx.fillStyle = `rgba(150, 150, 150, ${transparency})`
        ctx.beginPath()
        ctx.arc(x, y, size, 0, 2 * Math.PI)
        ctx.fill()
      }
    }

    // draw player
    {
      ctx.save()
      const [x, y] = state.player.pos
      ctx.fillStyle = "white"
      ctx.translate(x, y)
      ctx.rotate(state.player.angle)
      ctx.translate(-PLAYER_WIDTH / 2, -PLAYER_HEIGHT / 2)
      ctx.fillRect(0, 0, PLAYER_WIDTH, PLAYER_HEIGHT)
      ctx.restore()
    }
  }
}

function rotate(point: Vector2, angle: number): Vector2 {
  const [x, y] = point
  const sin = Math.sin(angle)
  const cos = Math.cos(angle)
  return [x * cos - y * sin, x * sin + y * cos]
}

// physics stuff
function update(dt: number) {
  // handle rotation
  if (state.keysDown.has("ArrowLeft") || state.keysDown.has("a"))
    state.player.angle -= (dt * PLAYER_ROT_SPEED) / 1000
  if (state.keysDown.has("ArrowRight") || state.keysDown.has("d"))
    state.player.angle += (dt * PLAYER_ROT_SPEED) / 1000

  // apply gravity
  state.player.vel[1] += (dt * GRAVITY) / 1000

  // apply thrust
  if (state.keysDown.has("ArrowUp") || state.keysDown.has("w")) {
    state.player.particleTimer += dt
    const UP = [Math.sin(state.player.angle), -Math.cos(state.player.angle)]
    state.player.vel[0] += (dt * THRUST * UP[0]) / 1000
    state.player.vel[1] += (dt * THRUST * UP[1]) / 1000
  }

  // apply drag
  state.player.vel[0] *= 1 - DRAG * 0.01 * dt
  state.player.vel[1] *= 1 - DRAG * 0.01 * dt

  // apply velocity
  state.player.pos[0] += (dt * state.player.vel[0]) / 1000
  state.player.pos[1] += (dt * state.player.vel[1]) / 1000

  // spawn particles
  if (state.player.particleTimer > PARTICLE_INTERVAL) {
    state.player.particleTimer -= PARTICLE_INTERVAL
    const [x, y] = state.player.pos
    const UP: Vector2 = [
      Math.sin(state.player.angle),
      -Math.cos(state.player.angle),
    ]
    const RAND_ANGLE = rotate(
      UP,
      (Math.random() - Math.PI / 2) * Math.PI + Math.PI
    )
    const VEL = Math.random() * PARTICLE_MAX_VEL
    state.player.particles.push(
      particle(
        [x - (UP[0] * PLAYER_HEIGHT) / 2, y - (UP[1] * PLAYER_HEIGHT) / 2],
        [RAND_ANGLE[0] * -VEL, RAND_ANGLE[1] * -VEL]
      )
    )
  }

  // update particles
  for (const particle of state.player.particles) {
    particle.pos[0] += (dt * particle.vel[0]) / 1000
    particle.pos[1] += (dt * particle.vel[1]) / 1000
    particle.age += dt
  }

  // remove old particles
  state.player.particles = state.player.particles.filter(
    (p) => p.age < MAX_PARTICLE_AGE
  )
}

export default function startGame(
  document: Document,
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement
) {
  document.body.addEventListener("keydown", (e) => {
    state.keysDown.add(e.key)
  })
  document.body.addEventListener("keyup", (e) => {
    state.keysDown.delete(e.key)
  })

  let lastRender = performance.now()
  function render() {
    const now = performance.now()
    const dt = now - lastRender
    lastRender = now

    const size = canvas.width
    ctx.resetTransform()
    ctx.scale(size / 100, size / 100)
    draw(ctx, dt)
    requestAnimationFrame(render)
  }
  render()

  const PHYSIC_TICKS_PER_SECOND = 200
  const PHYSIC_INTERVAL = 1000 / PHYSIC_TICKS_PER_SECOND

  let lastTick = performance.now()
  function physicTick() {
    const now = performance.now()
    const dt = now - lastTick
    update(dt)
    setTimeout(physicTick, lastTick + PHYSIC_INTERVAL - now)
    lastTick = now
  }
  physicTick()
}
