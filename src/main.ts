import startGame from "./game"

document.body.style.display = "flex"
document.body.style.justifyContent = "center"
document.body.style.alignItems = "center"

const canvas = document.createElement("canvas")
const ctx = canvas.getContext("2d") as CanvasRenderingContext2D
document.body.appendChild(canvas)

function setupCanvas() {
  const maxSide = Math.min(window.innerWidth, window.innerHeight)
  const dpi = window.devicePixelRatio
  canvas.width = maxSide * dpi
  canvas.height = maxSide * dpi
  canvas.style.width = `${maxSide}px`
  canvas.style.height = `${maxSide}px`
}
setupCanvas()
window.onresize = setupCanvas

startGame(document, ctx, canvas)
