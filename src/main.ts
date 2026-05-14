import Phaser from 'phaser'
import './style.css'

const GAME_WIDTH = 1280
const GAME_HEIGHT = 720
const MATCH_SECONDS = 90
const MAX_FLIES = 9

type Side = 'left' | 'right'
type Phase = 'menu' | 'playing' | 'paused' | 'gameover'

type Controls = {
  a: Phaser.Input.Keyboard.Key
  d: Phaser.Input.Keyboard.Key
  w: Phaser.Input.Keyboard.Key
  left: Phaser.Input.Keyboard.Key
  right: Phaser.Input.Keyboard.Key
  up: Phaser.Input.Keyboard.Key
  space: Phaser.Input.Keyboard.Key
  p: Phaser.Input.Keyboard.Key
}

type LashState = {
  start: Phaser.Math.Vector2
  end: Phaser.Math.Vector2
  startedAt: number
  duration: number
  caught: Set<number>
}

type PlayerState = {
  side: Side
  name: string
  team: string
  direction: 1 | -1
  aimIndex: number
  score: number
  lastFireAt: number
  powerUntil: number
  sprite: Phaser.GameObjects.Image
  aimGuide: Phaser.GameObjects.Graphics
  tongue: Phaser.GameObjects.Graphics
  scoreText: Phaser.GameObjects.Text
  powerText: Phaser.GameObjects.Text
  lash?: LashState
}

type FlyState = {
  id: number
  sprite: Phaser.GameObjects.Image
  baseY: number
  vx: number
  wobble: number
  amplitude: number
  value: number
  radius: number
}

type PowerState = {
  id: number
  sprite: Phaser.GameObjects.Image
  vx: number
  baseY: number
  wobble: number
  radius: number
}

type HudState = {
  timer: Phaser.GameObjects.Text
  title: Phaser.GameObjects.Text
  subtitle: Phaser.GameObjects.Text
  banner: Phaser.GameObjects.Text
  startButton: Phaser.GameObjects.Text
}

class MainScene extends Phaser.Scene {
  private phase: Phase = 'menu'
  private keys?: Controls
  private players: PlayerState[] = []
  private flies: FlyState[] = []
  private powers: PowerState[] = []
  private hud!: HudState
  private matchRemaining = MATCH_SECONDS
  private nextFlyAt = 0
  private nextPowerAt = 0
  private objectId = 1
  private audioContext?: AudioContext

  constructor() {
    super('main')
  }

  preload() {
    this.load.image('arena', 'assets/pond-arena.png')
    this.load.image('frog', 'assets/frog.png')
    this.load.image('fly', 'assets/fly.png')
    this.load.image('power', 'assets/power.png')
  }

  create() {
    this.createStage()
    this.createPlayers()
    this.createHud()
    this.createInput()
    this.setMenu()
  }

  update(time: number, delta: number) {
    const frameDelta = Math.min(delta, 80)

    this.updateAmbientMotion(time)
    this.updatePowerLabels(time)

    if (!this.keys) {
      return
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.space)) {
      if (this.phase === 'playing') {
        return
      }
      this.startMatch(time)
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.p)) {
      this.togglePause()
    }

    if (this.phase !== 'playing') {
      return
    }

    this.matchRemaining -= frameDelta / 1000
    if (this.matchRemaining <= 0) {
      this.finishMatch()
      return
    }

    this.handlePlayerInput(time)
    this.spawnLoop(time)
    this.updateFlies(time, frameDelta)
    this.updatePowers(time, frameDelta)
    this.updateLashes(time)
    this.updateHud()
  }

  private createStage() {
    this.add.image(0, 0, 'arena').setOrigin(0).setDisplaySize(GAME_WIDTH, GAME_HEIGHT)

    this.add
      .rectangle(0, 0, GAME_WIDTH, 94, 0x061d20, 0.48)
      .setOrigin(0)
      .setDepth(2)

    this.add
      .rectangle(0, GAME_HEIGHT - 104, GAME_WIDTH, 104, 0x071412, 0.34)
      .setOrigin(0)
      .setDepth(2)

    for (let i = 0; i < 16; i += 1) {
      this.createWaterGleam(i)
    }
  }

  private createWaterGleam(index: number) {
    const x = Phaser.Math.Between(180, GAME_WIDTH - 180)
    const y = Phaser.Math.Between(180, 500)
    const width = Phaser.Math.Between(32, 120)
    const gleam = this.add
      .ellipse(x, y, width, 5, 0xbef8e0, Phaser.Math.FloatBetween(0.08, 0.2))
      .setDepth(1)

    this.tweens.add({
      targets: gleam,
      alpha: Phaser.Math.FloatBetween(0.02, 0.16),
      x: x + Phaser.Math.Between(-18, 18),
      duration: 2200 + index * 120,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })
  }

  private createPlayers() {
    const leftSprite = this.add
      .image(188, 613, 'frog')
      .setOrigin(0.5, 1)
      .setScale(0.205)
      .setDepth(7)

    const rightSprite = this.add
      .image(GAME_WIDTH - 188, 613, 'frog')
      .setOrigin(0.5, 1)
      .setScale(0.205)
      .setFlipX(true)
      .setDepth(7)

    this.players = [
      {
        side: 'left',
        name: 'Emerald',
        team: 'Elite Team Emerald',
        direction: 1,
        aimIndex: 1,
        score: 0,
        lastFireAt: -1000,
        powerUntil: 0,
        sprite: leftSprite,
        aimGuide: this.add.graphics().setDepth(5),
        tongue: this.add.graphics().setDepth(8),
        scoreText: this.addText(34, 22, '', 30, '#e8ffd6').setOrigin(0, 0),
        powerText: this.addText(36, 58, '', 15, '#ffe889').setOrigin(0, 0),
      },
      {
        side: 'right',
        name: 'Azure',
        team: 'Elite Team Azure',
        direction: -1,
        aimIndex: 1,
        score: 0,
        lastFireAt: -1000,
        powerUntil: 0,
        sprite: rightSprite,
        aimGuide: this.add.graphics().setDepth(5),
        tongue: this.add.graphics().setDepth(8),
        scoreText: this.addText(GAME_WIDTH - 34, 22, '', 30, '#d9f4ff').setOrigin(1, 0),
        powerText: this.addText(GAME_WIDTH - 36, 58, '', 15, '#ffe889').setOrigin(1, 0),
      },
    ]

    this.players.forEach((player) => this.drawAimGuide(player))
  }

  private createHud() {
    const title = this.addText(GAME_WIDTH / 2, 12, 'FROGS & FLIES', 36, '#fff6c8')
      .setOrigin(0.5, 0)
      .setDepth(9)

    const subtitle = this.addText(GAME_WIDTH / 2, 50, 'SUPERPOWERS  |  ELITETEAMS', 13, '#b7f7e2')
      .setOrigin(0.5, 0)
      .setDepth(9)

    const timer = this.addText(GAME_WIDTH / 2, 646, '', 32, '#fff6d7')
      .setOrigin(0.5, 0.5)
      .setDepth(9)

    const banner = this.addText(GAME_WIDTH / 2, 283, '', 50, '#ffffff')
      .setOrigin(0.5)
      .setDepth(11)

    const startButton = this.addText(GAME_WIDTH / 2, 380, 'START MATCH', 24, '#071412')
      .setOrigin(0.5)
      .setPadding(28, 13, 28, 13)
      .setBackgroundColor('#fff1a7')
      .setDepth(11)
      .setInteractive({ useHandCursor: true })

    startButton.on('pointerdown', () => this.startMatch(this.time.now))
    startButton.on('pointerover', () => startButton.setBackgroundColor('#ffffff'))
    startButton.on('pointerout', () => startButton.setBackgroundColor('#fff1a7'))

    this.hud = { timer, title, subtitle, banner, startButton }
  }

  private createInput() {
    const keyboard = this.input.keyboard
    if (!keyboard) {
      return
    }

    this.keys = {
      a: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      d: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      w: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
      up: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      space: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      p: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P),
    }

    keyboard.addCapture([
      Phaser.Input.Keyboard.KeyCodes.SPACE,
      Phaser.Input.Keyboard.KeyCodes.UP,
      Phaser.Input.Keyboard.KeyCodes.LEFT,
      Phaser.Input.Keyboard.KeyCodes.RIGHT,
    ])
  }

  private setMenu() {
    this.phase = 'menu'
    this.hud.banner.setText('FROGS & FLIES')
    this.hud.startButton.setVisible(true)
    this.hud.title.setVisible(false)
    this.hud.subtitle.setVisible(false)
    this.hud.timer.setText('90')
    this.updateScoreLabels()
  }

  private startMatch(time: number) {
    this.unlockAudio()
    this.phase = 'playing'
    this.matchRemaining = MATCH_SECONDS
    this.nextFlyAt = time
    this.nextPowerAt = time + 9000
    this.objectId = 1
    this.clearObjects()
    this.players.forEach((player) => {
      player.score = 0
      player.aimIndex = 1
      player.lastFireAt = -1000
      player.powerUntil = 0
      player.lash = undefined
      player.tongue.clear()
      player.sprite.clearTint()
      this.drawAimGuide(player)
    })

    this.hud.banner.setText('')
    this.hud.startButton.setVisible(false)
    this.hud.title.setVisible(true)
    this.hud.subtitle.setVisible(true)
    this.updateScoreLabels()
    this.updateHud()

    for (let i = 0; i < 5; i += 1) {
      this.spawnFly(time + i * 100)
    }

    this.playTone(440, 0.09, 'triangle', 0.04)
  }

  private togglePause() {
    if (this.phase === 'playing') {
      this.phase = 'paused'
      this.hud.banner.setText('PAUSED')
      this.hud.startButton.setVisible(true).setText('RESUME')
      return
    }

    if (this.phase === 'paused') {
      this.phase = 'playing'
      this.hud.banner.setText('')
      this.hud.startButton.setVisible(false).setText('START MATCH')
    }
  }

  private handlePlayerInput(time: number) {
    if (!this.keys) {
      return
    }

    const [leftPlayer, rightPlayer] = this.players

    if (Phaser.Input.Keyboard.JustDown(this.keys.a)) {
      this.changeAim(leftPlayer, -1)
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.d)) {
      this.changeAim(leftPlayer, 1)
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.w)) {
      this.fireTongue(leftPlayer, time)
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.left)) {
      this.changeAim(rightPlayer, -1)
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.right)) {
      this.changeAim(rightPlayer, 1)
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.up)) {
      this.fireTongue(rightPlayer, time)
    }
  }

  private changeAim(player: PlayerState, delta: number) {
    player.aimIndex = Phaser.Math.Clamp(player.aimIndex + delta, 0, 2)
    this.drawAimGuide(player)
    this.playTone(260 + player.aimIndex * 40, 0.025, 'sine', 0.015)
  }

  private fireTongue(player: PlayerState, time: number) {
    const powered = this.isPowered(player, time)
    const cooldown = powered ? 210 : 360
    if (time - player.lastFireAt < cooldown) {
      return
    }

    const start = this.getMouth(player)
    const end = this.getAimTarget(player, powered ? 52 : 0)
    player.lastFireAt = time
    player.lash = {
      start,
      end,
      startedAt: time,
      duration: powered ? 250 : 310,
      caught: new Set<number>(),
    }

    this.tweens.killTweensOf(player.sprite)
    this.tweens.add({
      targets: player.sprite,
      y: 584,
      scaleX: 0.215,
      scaleY: 0.215,
      duration: 105,
      yoyo: true,
      ease: 'Sine.easeOut',
      onComplete: () => {
        player.sprite.setY(613)
        player.sprite.setScale(0.205)
        player.sprite.setFlipX(player.side === 'right')
      },
    })

    this.playTone(powered ? 760 : 620, 0.055, 'sawtooth', 0.022)
  }

  private spawnLoop(time: number) {
    if (time >= this.nextFlyAt && this.flies.length < MAX_FLIES) {
      this.spawnFly(time)
      this.nextFlyAt = time + Phaser.Math.Between(540, 1080)
    }

    if (time >= this.nextPowerAt && this.powers.length === 0) {
      this.spawnPower()
      this.nextPowerAt = time + Phaser.Math.Between(12500, 17000)
    }
  }

  private spawnFly(time: number) {
    const fromLeft = Math.random() > 0.5
    const y = Phaser.Math.Between(128, 388)
    const elite = Math.random() > 0.78
    const sprite = this.add
      .image(fromLeft ? -70 : GAME_WIDTH + 70, y, 'fly')
      .setScale(elite ? 0.073 : Phaser.Math.FloatBetween(0.055, 0.068))
      .setDepth(6)
      .setFlipX(!fromLeft)

    if (elite) {
      sprite.setTint(0xffe48a)
    }

    this.flies.push({
      id: this.objectId,
      sprite,
      baseY: y,
      vx: (fromLeft ? 1 : -1) * Phaser.Math.Between(88, 172),
      wobble: Phaser.Math.FloatBetween(0.0035, 0.0075),
      amplitude: Phaser.Math.Between(12, 42),
      value: elite ? 15 : 10,
      radius: elite ? 34 : 28,
    })
    this.objectId += 1

    if (time % 2 > 1) {
      sprite.setAlpha(0.92)
    }
  }

  private spawnPower() {
    const fromLeft = Math.random() > 0.5
    const y = Phaser.Math.Between(165, 360)
    const sprite = this.add
      .image(fromLeft ? -64 : GAME_WIDTH + 64, y, 'power')
      .setScale(0.09)
      .setDepth(6)

    this.tweens.add({
      targets: sprite,
      scale: 0.105,
      duration: 580,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })

    this.powers.push({
      id: this.objectId,
      sprite,
      vx: (fromLeft ? 1 : -1) * Phaser.Math.Between(62, 86),
      baseY: y,
      wobble: Phaser.Math.FloatBetween(0.004, 0.006),
      radius: 34,
    })
    this.objectId += 1
  }

  private updateFlies(time: number, delta: number) {
    const dt = delta / 1000
    this.flies = this.flies.filter((fly) => {
      fly.sprite.x += fly.vx * dt
      fly.sprite.y = fly.baseY + Math.sin(time * fly.wobble + fly.id) * fly.amplitude
      fly.sprite.rotation = Math.sin(time * 0.006 + fly.id) * 0.06

      const visible = fly.sprite.x > -130 && fly.sprite.x < GAME_WIDTH + 130
      if (!visible) {
        fly.sprite.destroy()
      }
      return visible
    })
  }

  private updatePowers(time: number, delta: number) {
    const dt = delta / 1000
    this.powers = this.powers.filter((power) => {
      power.sprite.x += power.vx * dt
      power.sprite.y = power.baseY + Math.sin(time * power.wobble + power.id) * 26
      power.sprite.rotation += 0.8 * dt

      const visible = power.sprite.x > -130 && power.sprite.x < GAME_WIDTH + 130
      if (!visible) {
        this.tweens.killTweensOf(power.sprite)
        power.sprite.destroy()
      }
      return visible
    })
  }

  private updateLashes(time: number) {
    this.players.forEach((player) => {
      const lash = player.lash
      if (!lash) {
        return
      }

      const elapsed = time - lash.startedAt
      const normalized = Phaser.Math.Clamp(elapsed / lash.duration, 0, 1)
      if (normalized >= 1) {
        player.lash = undefined
        player.tongue.clear()
        return
      }

      const travel = normalized < 0.58 ? normalized / 0.58 : 1 - (normalized - 0.58) / 0.42
      const eased = Math.sin(Phaser.Math.Clamp(travel, 0, 1) * Math.PI * 0.5)
      const tip = new Phaser.Math.Vector2(
        Phaser.Math.Linear(lash.start.x, lash.end.x, eased),
        Phaser.Math.Linear(lash.start.y, lash.end.y, eased),
      )

      this.drawTongue(player, lash.start, tip, time)
      if (normalized < 0.72) {
        this.checkTongueHits(player, lash, tip, time)
      }
    })
  }

  private checkTongueHits(player: PlayerState, lash: LashState, tip: Phaser.Math.Vector2, time: number) {
    const powered = this.isPowered(player, time)

    for (const power of [...this.powers]) {
      if (this.distanceToSegment(power.sprite.x, power.sprite.y, lash.start.x, lash.start.y, tip.x, tip.y) <= power.radius) {
        this.collectPower(player, power, time)
        break
      }
    }

    for (const fly of [...this.flies]) {
      if (lash.caught.has(fly.id)) {
        continue
      }

      const distance = this.distanceToSegment(fly.sprite.x, fly.sprite.y, lash.start.x, lash.start.y, tip.x, tip.y)
      if (distance > fly.radius) {
        continue
      }

      lash.caught.add(fly.id)
      this.collectFly(player, fly, powered, time)

      if (!powered || lash.caught.size >= 3) {
        player.lash = undefined
        player.tongue.clear()
        break
      }
    }
  }

  private collectFly(player: PlayerState, fly: FlyState, powered: boolean, time: number) {
    const multiplier = powered ? 2 : 1
    player.score += fly.value * multiplier
    this.flies = this.flies.filter((candidate) => candidate.id !== fly.id)
    this.popAt(fly.sprite.x, fly.sprite.y, powered ? 0xfff28c : 0xbdf7ff)
    fly.sprite.destroy()
    this.updateScoreLabels()
    this.playTone(powered ? 980 : 820, 0.07, 'square', powered ? 0.03 : 0.022)

    if (powered) {
      this.addFloatingScore(fly.sprite.x, fly.sprite.y, `+${fly.value * multiplier}`, '#fff1a8')
    } else {
      this.addFloatingScore(fly.sprite.x, fly.sprite.y, `+${fly.value}`, '#d6fff4')
    }

    if (this.flies.length < MAX_FLIES - 2) {
      this.nextFlyAt = Math.min(this.nextFlyAt, time + 180)
    }
  }

  private collectPower(player: PlayerState, power: PowerState, time: number) {
    player.powerUntil = time + 6500
    player.score += 5
    player.sprite.setTint(0xffeb83)
    this.powers = this.powers.filter((candidate) => candidate.id !== power.id)
    this.tweens.killTweensOf(power.sprite)
    this.popAt(power.sprite.x, power.sprite.y, 0xffe478, 12)
    this.addFloatingScore(power.sprite.x, power.sprite.y, 'RUSH', '#fff1a8')
    power.sprite.destroy()
    this.updateScoreLabels()
    this.playTone(1180, 0.14, 'triangle', 0.04)
  }

  private finishMatch() {
    this.phase = 'gameover'
    this.matchRemaining = 0
    this.players.forEach((player) => {
      player.lash = undefined
      player.tongue.clear()
      player.sprite.clearTint()
    })

    const [leftPlayer, rightPlayer] = this.players
    const result =
      leftPlayer.score === rightPlayer.score
        ? 'DRAW'
        : `${leftPlayer.score > rightPlayer.score ? leftPlayer.team : rightPlayer.team} WINS`

    this.hud.banner.setText(result)
    this.hud.startButton.setVisible(true).setText('PLAY AGAIN')
    this.updateHud()
    this.playTone(330, 0.24, 'triangle', 0.035)
  }

  private drawAimGuide(player: PlayerState) {
    const start = this.getMouth(player)
    const end = this.getAimTarget(player, 0)
    const guideEnd = new Phaser.Math.Vector2(
      Phaser.Math.Linear(start.x, end.x, 0.28),
      Phaser.Math.Linear(start.y, end.y, 0.28),
    )

    player.aimGuide.clear()
    player.aimGuide.lineStyle(2, player.side === 'left' ? 0xdfff9a : 0xaee8ff, 0.7)
    player.aimGuide.lineBetween(start.x, start.y, guideEnd.x, guideEnd.y)
    player.aimGuide.fillStyle(player.side === 'left' ? 0xdfff9a : 0xaee8ff, 0.8)
    player.aimGuide.fillCircle(guideEnd.x, guideEnd.y, 4)
  }

  private drawTongue(player: PlayerState, start: Phaser.Math.Vector2, tip: Phaser.Math.Vector2, time: number) {
    const powered = this.isPowered(player, time)
    player.tongue.clear()
    player.tongue.lineStyle(powered ? 8 : 6, powered ? 0xffd95b : 0xff7b8b, 0.95)
    player.tongue.lineBetween(start.x, start.y, tip.x, tip.y)
    player.tongue.fillStyle(powered ? 0xfff3a1 : 0xff9aa7, 1)
    player.tongue.fillCircle(tip.x, tip.y, powered ? 8 : 6)
  }

  private getMouth(player: PlayerState) {
    return new Phaser.Math.Vector2(player.sprite.x + player.direction * 62, player.sprite.y - 104)
  }

  private getAimTarget(player: PlayerState, bonusRange: number) {
    const xOffsets = [80, 270, 468 + bonusRange]
    const yOffsets = [435, 510 + bonusRange, 438]
    const offsetX = xOffsets[player.aimIndex] * player.direction
    const offsetY = yOffsets[player.aimIndex]
    return new Phaser.Math.Vector2(player.sprite.x + offsetX, player.sprite.y - offsetY)
  }

  private updateAmbientMotion(time: number) {
    this.players.forEach((player, index) => {
      if (player.lash) {
        return
      }
      player.sprite.y = 613 + Math.sin(time * 0.0022 + index) * 2.4
    })
  }

  private updatePowerLabels(time: number) {
    this.players.forEach((player) => {
      const powered = this.isPowered(player, time)
      if (!powered) {
        player.powerText.setText('')
        player.sprite.clearTint()
        return
      }

      const remaining = Math.ceil((player.powerUntil - time) / 1000)
      player.powerText.setText(`RUSH ${remaining}`)
    })
  }

  private updateHud() {
    this.hud.timer.setText(`${Math.ceil(this.matchRemaining)}`)
  }

  private updateScoreLabels() {
    this.players.forEach((player) => {
      player.scoreText.setText(`${player.name}  ${player.score}`)
    })
  }

  private clearObjects() {
    this.flies.forEach((fly) => fly.sprite.destroy())
    this.powers.forEach((power) => {
      this.tweens.killTweensOf(power.sprite)
      power.sprite.destroy()
    })
    this.flies = []
    this.powers = []
  }

  private popAt(x: number, y: number, color: number, count = 8) {
    for (let i = 0; i < count; i += 1) {
      const particle = this.add.circle(x, y, Phaser.Math.Between(3, 7), color, Phaser.Math.FloatBetween(0.45, 0.9)).setDepth(10)
      this.tweens.add({
        targets: particle,
        x: x + Phaser.Math.Between(-44, 44),
        y: y + Phaser.Math.Between(-36, 28),
        alpha: 0,
        scale: 0.25,
        duration: Phaser.Math.Between(360, 640),
        ease: 'Cubic.easeOut',
        onComplete: () => particle.destroy(),
      })
    }
  }

  private addFloatingScore(x: number, y: number, label: string, color: string) {
    const text = this.addText(x, y - 12, label, 20, color).setOrigin(0.5).setDepth(12)
    this.tweens.add({
      targets: text,
      y: y - 56,
      alpha: 0,
      duration: 620,
      ease: 'Cubic.easeOut',
      onComplete: () => text.destroy(),
    })
  }

  private addText(x: number, y: number, value: string, size: number, color: string) {
    return this.add.text(x, y, value, {
      fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: `${size}px`,
      color,
      stroke: '#082022',
      strokeThickness: Math.max(2, Math.round(size / 9)),
      shadow: {
        offsetX: 0,
        offsetY: 3,
        color: '#001315',
        blur: 7,
        fill: true,
      },
    })
  }

  private isPowered(player: PlayerState, time: number) {
    return player.powerUntil > time
  }

  private distanceToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
    const dx = bx - ax
    const dy = by - ay
    const lengthSq = dx * dx + dy * dy

    if (lengthSq === 0) {
      return Math.hypot(px - ax, py - ay)
    }

    const t = Phaser.Math.Clamp(((px - ax) * dx + (py - ay) * dy) / lengthSq, 0, 1)
    const closestX = ax + t * dx
    const closestY = ay + t * dy
    return Math.hypot(px - closestX, py - closestY)
  }

  private unlockAudio() {
    if (!this.audioContext) {
      this.audioContext = new AudioContext()
    }

    if (this.audioContext.state === 'suspended') {
      void this.audioContext.resume()
    }
  }

  private playTone(frequency: number, duration: number, type: OscillatorType, gain: number) {
    const context = this.audioContext
    if (!context || context.state !== 'running') {
      return
    }

    const oscillator = context.createOscillator()
    const volume = context.createGain()
    oscillator.frequency.value = frequency
    oscillator.type = type
    volume.gain.setValueAtTime(gain, context.currentTime)
    volume.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration)
    oscillator.connect(volume)
    volume.connect(context.destination)
    oscillator.start()
    oscillator.stop(context.currentTime + duration)
  }
}

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <main class="game-shell" aria-label="Frogs and Flies arcade game">
    <div id="game"></div>
  </main>
`

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#06252b',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  render: {
    antialias: true,
    pixelArt: false,
  },
  scene: MainScene,
}

new Phaser.Game(config)
