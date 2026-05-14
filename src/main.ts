import Phaser from 'phaser'
import './style.css'

const GAME_WIDTH = 1280
const GAME_HEIGHT = 720
const DEFAULT_MATCH_SECONDS = 90
const MAX_FLIES = 9
const AIM_LANES = 5
const CENTER_AIM = 2
const ROUND_LENGTHS = [60, 90, 120] as const

type Side = 'left' | 'right'
type Phase = 'menu' | 'playing' | 'paused' | 'gameover'
type MenuView = 'main' | 'options' | 'tutorial'
type GameMode = 'pvp' | 'cpu'
type CpuDifficulty = 'easy' | 'normal' | 'elite'
type RoundLength = (typeof ROUND_LENGTHS)[number]

type Controls = {
  a: Phaser.Input.Keyboard.Key
  d: Phaser.Input.Keyboard.Key
  w: Phaser.Input.Keyboard.Key
  left: Phaser.Input.Keyboard.Key
  right: Phaser.Input.Keyboard.Key
  up: Phaser.Input.Keyboard.Key
  enter: Phaser.Input.Keyboard.Key
  space: Phaser.Input.Keyboard.Key
  escape: Phaser.Input.Keyboard.Key
  p: Phaser.Input.Keyboard.Key
}

type GameOptions = {
  mode: GameMode
  cpuDifficulty: CpuDifficulty
  roundSeconds: RoundLength
  sound: boolean
  aimGuides: boolean
}

type CpuProfile = {
  label: string
  reactionMin: number
  reactionMax: number
  accuracy: number
  fireWindow: number
  minFireGap: number
  powerBias: number
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
  isCpu: boolean
  cpuNextThinkAt: number
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
  modeText: Phaser.GameObjects.Text
  banner: Phaser.GameObjects.Text
  primaryButton: Phaser.GameObjects.Text
  secondaryButton: Phaser.GameObjects.Text
}

type MenuState = {
  main: Phaser.GameObjects.Container
  options: Phaser.GameObjects.Container
  tutorial: Phaser.GameObjects.Container
  mainSummary: Phaser.GameObjects.Text
  modeButton: Phaser.GameObjects.Text
  difficultyButton: Phaser.GameObjects.Text
  roundButton: Phaser.GameObjects.Text
  soundButton: Phaser.GameObjects.Text
  aimButton: Phaser.GameObjects.Text
}

type CpuTarget = {
  id: number
  kind: 'fly' | 'power'
  x: number
  y: number
  value: number
  radius: number
}

const CPU_PROFILES: Record<CpuDifficulty, CpuProfile> = {
  easy: {
    label: 'Rookie',
    reactionMin: 520,
    reactionMax: 940,
    accuracy: 0.58,
    fireWindow: 58,
    minFireGap: 560,
    powerBias: 0.75,
  },
  normal: {
    label: 'Pro',
    reactionMin: 330,
    reactionMax: 620,
    accuracy: 0.78,
    fireWindow: 45,
    minFireGap: 410,
    powerBias: 1.05,
  },
  elite: {
    label: 'Elite',
    reactionMin: 190,
    reactionMax: 390,
    accuracy: 0.93,
    fireWindow: 34,
    minFireGap: 280,
    powerBias: 1.35,
  },
}

class MainScene extends Phaser.Scene {
  private phase: Phase = 'menu'
  private currentMenuView: MenuView = 'main'
  private keys?: Controls
  private players: PlayerState[] = []
  private flies: FlyState[] = []
  private powers: PowerState[] = []
  private hud!: HudState
  private menu!: MenuState
  private options: GameOptions = {
    mode: 'cpu',
    cpuDifficulty: 'normal',
    roundSeconds: DEFAULT_MATCH_SECONDS,
    sound: true,
    aimGuides: true,
  }
  private matchRemaining = DEFAULT_MATCH_SECONDS
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
    this.showMainMenu()
  }

  update(time: number, delta: number) {
    const frameDelta = Math.min(delta, 80)

    this.updateAmbientMotion(time)
    this.updatePowerLabels(time)

    if (!this.keys) {
      return
    }

    this.handleGlobalInput(time)

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
    this.updateCpu(time)
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
        aimIndex: CENTER_AIM,
        score: 0,
        lastFireAt: -1000,
        powerUntil: 0,
        isCpu: false,
        cpuNextThinkAt: 0,
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
        aimIndex: CENTER_AIM,
        score: 0,
        lastFireAt: -1000,
        powerUntil: 0,
        isCpu: true,
        cpuNextThinkAt: 0,
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

    const modeText = this.addText(GAME_WIDTH / 2, 70, '', 13, '#fff1a7')
      .setOrigin(0.5, 0)
      .setDepth(9)

    const timer = this.addText(GAME_WIDTH / 2, 646, '', 32, '#fff6d7')
      .setOrigin(0.5, 0.5)
      .setDepth(9)

    const banner = this.addText(GAME_WIDTH / 2, 283, '', 50, '#ffffff')
      .setOrigin(0.5)
      .setDepth(11)

    const primaryButton = this.makeButton(GAME_WIDTH / 2, 380, 'START MATCH', () => this.activatePrimaryButton(), 24)
      .setDepth(11)
      .setVisible(false)

    const secondaryButton = this.makeButton(GAME_WIDTH / 2, 442, 'MENU', () => this.showMainMenu(), 18)
      .setDepth(11)
      .setVisible(false)

    this.hud = { timer, title, subtitle, modeText, banner, primaryButton, secondaryButton }
    this.menu = this.createMenuLayers()
  }

  private createMenuLayers(): MenuState {
    const mainPanel = this.createPanel(640, 360, 720, 442)
    const mainTitle = this.addText(640, 188, 'FROGS & FLIES', 54, '#ffffff').setOrigin(0.5)
    const mainSub = this.addText(640, 236, 'SUPERPOWERS  |  ELITETEAMS', 16, '#b7f7e2').setOrigin(0.5)
    const mainSummary = this.addText(640, 282, '', 18, '#fff1a7').setOrigin(0.5)
    const start = this.makeButton(640, 340, 'START MATCH', () => this.startMatch(this.time.now), 24)
    const options = this.makeButton(520, 416, 'OPTIONS', () => this.showOptions(), 18)
    const tutorial = this.makeButton(760, 416, 'TUTORIAL', () => this.showTutorial(), 18)
    const main = this.add
      .container(0, 0, [mainPanel, mainTitle, mainSub, mainSummary, start, options, tutorial])
      .setDepth(12)

    const optionsPanel = this.createPanel(640, 360, 760, 500)
    const optionsTitle = this.addText(640, 150, 'OPTIONS', 42, '#ffffff').setOrigin(0.5)
    const modeButton = this.makeButton(640, 220, '', () => this.toggleMode(), 19)
    const difficultyButton = this.makeButton(640, 282, '', () => this.cycleDifficulty(), 19)
    const roundButton = this.makeButton(640, 344, '', () => this.cycleRoundLength(), 19)
    const aimButton = this.makeButton(640, 406, '', () => this.toggleAimGuides(), 19)
    const soundButton = this.makeButton(640, 468, '', () => this.toggleSound(), 19)
    const optionsBack = this.makeButton(520, 546, 'BACK', () => this.showMainMenu(), 18)
    const optionsStart = this.makeButton(760, 546, 'START', () => this.startMatch(this.time.now), 18)
    const optionsLayer = this.add
      .container(0, 0, [
        optionsPanel,
        optionsTitle,
        modeButton,
        difficultyButton,
        roundButton,
        aimButton,
        soundButton,
        optionsBack,
        optionsStart,
      ])
      .setDepth(12)
      .setVisible(false)

    const tutorialPanel = this.createPanel(640, 382, 835, 560)
    const tutorialTitle = this.addText(640, 150, 'TUTORIAL', 42, '#ffffff').setOrigin(0.5)
    const tutorialBody = this.add.text(640, 230, this.getTutorialText(), {
      fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '22px',
      color: '#eafff4',
      align: 'left',
      lineSpacing: 8,
      wordWrap: { width: 690 },
      stroke: '#082022',
      strokeThickness: 4,
      shadow: {
        offsetX: 0,
        offsetY: 3,
        color: '#001315',
        blur: 7,
        fill: true,
      },
    }).setOrigin(0.5, 0)
    const tutorialBack = this.makeButton(520, 620, 'BACK', () => this.showMainMenu(), 18)
    const tutorialStart = this.makeButton(760, 620, 'START', () => this.startMatch(this.time.now), 18)
    const tutorialLayer = this.add
      .container(0, 0, [tutorialPanel, tutorialTitle, tutorialBody, tutorialBack, tutorialStart])
      .setDepth(12)
      .setVisible(false)

    return {
      main,
      options: optionsLayer,
      tutorial: tutorialLayer,
      mainSummary,
      modeButton,
      difficultyButton,
      roundButton,
      soundButton,
      aimButton,
    }
  }

  private createPanel(x: number, y: number, width: number, height: number) {
    return this.add
      .rectangle(x, y, width, height, 0x05252a, 0.78)
      .setStrokeStyle(1, 0xdfffc2, 0.32)
  }

  private makeButton(x: number, y: number, label: string, onClick: () => void, size: number) {
    const button = this.addText(x, y, label, size, '#071412')
      .setOrigin(0.5)
      .setPadding(22, 10, 22, 10)
      .setBackgroundColor('#fff1a7')
      .setInteractive({ useHandCursor: true })

    button.on('pointerdown', () => {
      this.unlockAudio()
      onClick()
    })
    button.on('pointerover', () => button.setBackgroundColor('#ffffff'))
    button.on('pointerout', () => button.setBackgroundColor('#fff1a7'))
    return button
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
      enter: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER),
      space: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      escape: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC),
      p: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P),
    }

    keyboard.addCapture([
      Phaser.Input.Keyboard.KeyCodes.SPACE,
      Phaser.Input.Keyboard.KeyCodes.UP,
      Phaser.Input.Keyboard.KeyCodes.LEFT,
      Phaser.Input.Keyboard.KeyCodes.RIGHT,
      Phaser.Input.Keyboard.KeyCodes.ENTER,
    ])
  }

  private handleGlobalInput(time: number) {
    if (!this.keys) {
      return
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.escape)) {
      if (this.phase === 'menu' && this.currentMenuView !== 'main') {
        this.showMainMenu()
        return
      }

      if (this.phase === 'playing' || this.phase === 'paused') {
        this.togglePause()
        return
      }
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.p)) {
      this.togglePause()
      return
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.space)) {
      if (this.phase === 'playing') {
        this.fireTongue(this.players[0], time)
        return
      }

      if (this.phase === 'paused') {
        this.togglePause()
        return
      }

      if (this.phase === 'menu' && this.currentMenuView === 'main') {
        this.startMatch(time)
        return
      }

      if (this.phase === 'gameover') {
        this.startMatch(time)
      }
    }
  }

  private showMainMenu() {
    this.currentMenuView = 'main'
    this.phase = 'menu'
    this.matchRemaining = this.options.roundSeconds
    this.clearObjects()
    this.players.forEach((player) => {
      player.score = 0
      player.powerUntil = 0
      player.lash = undefined
      player.tongue.clear()
      player.sprite.clearTint()
      player.aimIndex = CENTER_AIM
      this.drawAimGuide(player)
    })

    this.menu.main.setVisible(true)
    this.menu.options.setVisible(false)
    this.menu.tutorial.setVisible(false)
    this.hud.title.setVisible(false)
    this.hud.subtitle.setVisible(false)
    this.hud.modeText.setVisible(false)
    this.hud.banner.setText('')
    this.hud.primaryButton.setVisible(false)
    this.hud.secondaryButton.setVisible(false)
    this.updateMenuLabels()
    this.updateScoreLabels()
    this.updateHud()
  }

  private showOptions() {
    this.currentMenuView = 'options'
    this.menu.main.setVisible(false)
    this.menu.options.setVisible(true)
    this.menu.tutorial.setVisible(false)
    this.updateMenuLabels()
  }

  private showTutorial() {
    this.currentMenuView = 'tutorial'
    this.menu.main.setVisible(false)
    this.menu.options.setVisible(false)
    this.menu.tutorial.setVisible(true)
  }

  private activatePrimaryButton() {
    if (this.phase === 'paused') {
      this.togglePause()
      return
    }

    this.startMatch(this.time.now)
  }

  private startMatch(time: number) {
    this.unlockAudio()
    this.currentMenuView = 'main'
    this.phase = 'playing'
    this.matchRemaining = this.options.roundSeconds
    this.nextFlyAt = time
    this.nextPowerAt = time + 9000
    this.objectId = 1
    this.clearObjects()
    this.players.forEach((player) => {
      player.score = 0
      player.aimIndex = CENTER_AIM
      player.lastFireAt = -1000
      player.powerUntil = 0
      player.lash = undefined
      player.tongue.clear()
      player.sprite.clearTint()
      player.cpuNextThinkAt = time + 350
    })
    this.players[1].isCpu = this.options.mode === 'cpu'

    this.menu.main.setVisible(false)
    this.menu.options.setVisible(false)
    this.menu.tutorial.setVisible(false)
    this.hud.banner.setText('')
    this.hud.primaryButton.setVisible(false).setText('START MATCH')
    this.hud.secondaryButton.setVisible(false)
    this.hud.title.setVisible(true)
    this.hud.subtitle.setVisible(true)
    this.hud.modeText.setVisible(true)
    this.updateScoreLabels()
    this.updateHud()
    this.updateModeText()
    this.players.forEach((player) => this.drawAimGuide(player))

    for (let i = 0; i < 5; i += 1) {
      this.spawnFly(time + i * 100)
    }

    this.playTone(440, 0.09, 'triangle', 0.04)
  }

  private togglePause() {
    if (this.phase === 'playing') {
      this.phase = 'paused'
      this.hud.banner.setText('PAUSED')
      this.hud.primaryButton.setVisible(true).setText('RESUME')
      this.hud.secondaryButton.setVisible(true)
      return
    }

    if (this.phase === 'paused') {
      this.phase = 'playing'
      this.hud.banner.setText('')
      this.hud.primaryButton.setVisible(false).setText('START MATCH')
      this.hud.secondaryButton.setVisible(false)
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

    if (this.options.mode === 'pvp') {
      if (Phaser.Input.Keyboard.JustDown(this.keys.left)) {
        this.changeAim(rightPlayer, -1)
      }
      if (Phaser.Input.Keyboard.JustDown(this.keys.right)) {
        this.changeAim(rightPlayer, 1)
      }
      if (Phaser.Input.Keyboard.JustDown(this.keys.up) || Phaser.Input.Keyboard.JustDown(this.keys.enter)) {
        this.fireTongue(rightPlayer, time)
      }
    }
  }

  private changeAim(player: PlayerState, delta: number) {
    player.aimIndex = Phaser.Math.Clamp(player.aimIndex + delta, 0, AIM_LANES - 1)
    this.drawAimGuide(player)
    this.playTone(240 + player.aimIndex * 34, 0.025, 'sine', 0.015)
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

  private updateCpu(time: number) {
    if (this.options.mode !== 'cpu' || this.phase !== 'playing') {
      return
    }

    const cpu = this.players[1]
    const profile = CPU_PROFILES[this.options.cpuDifficulty]
    if (time < cpu.cpuNextThinkAt || cpu.lash) {
      return
    }

    const target = this.pickCpuTarget(cpu, profile, time)
    if (target) {
      cpu.aimIndex = this.getCpuAim(cpu, target, profile)
      this.drawAimGuide(cpu)

      const start = this.getMouth(cpu)
      const end = this.getAimTarget(cpu, this.isPowered(cpu, time) ? 52 : 0)
      const distance = this.distanceToSegment(target.x, target.y, start.x, start.y, end.x, end.y)
      const canFire = distance <= profile.fireWindow && time - cpu.lastFireAt >= profile.minFireGap
      if (canFire) {
        this.fireTongue(cpu, time)
      }
    }

    cpu.cpuNextThinkAt = time + Phaser.Math.Between(profile.reactionMin, profile.reactionMax)
  }

  private pickCpuTarget(cpu: PlayerState, profile: CpuProfile, time: number): CpuTarget | undefined {
    const targets: CpuTarget[] = [
      ...this.flies.map((fly) => ({
        id: fly.id,
        kind: 'fly' as const,
        x: fly.sprite.x,
        y: fly.sprite.y,
        value: fly.value,
        radius: fly.radius,
      })),
      ...this.powers.map((power) => ({
        id: power.id,
        kind: 'power' as const,
        x: power.sprite.x,
        y: power.sprite.y,
        value: this.isPowered(cpu, time) ? 5 : 26,
        radius: power.radius,
      })),
    ]

    const mouth = this.getMouth(cpu)
    let bestTarget: CpuTarget | undefined
    let bestScore = Number.NEGATIVE_INFINITY

    targets.forEach((target) => {
      if (target.x > cpu.sprite.x - 24 || target.y < 95 || target.y > 485) {
        return
      }

      const range = Phaser.Math.Distance.Between(mouth.x, mouth.y, target.x, target.y)
      if (range > 650) {
        return
      }

      const aim = this.getBestAimIndexForTarget(cpu, target.x, target.y, this.isPowered(cpu, time) ? 52 : 0)
      const end = this.getAimTargetForIndex(cpu, aim, this.isPowered(cpu, time) ? 52 : 0)
      const lineDistance = this.distanceToSegment(target.x, target.y, mouth.x, mouth.y, end.x, end.y)
      const powerScore = target.kind === 'power' ? profile.powerBias * 24 : 0
      const score = target.value * 12 + powerScore - range * 0.03 - lineDistance * 1.05

      if (score > bestScore) {
        bestScore = score
        bestTarget = target
      }
    })

    return bestTarget
  }

  private getCpuAim(cpu: PlayerState, target: CpuTarget, profile: CpuProfile) {
    let aim = this.getBestAimIndexForTarget(cpu, target.x, target.y, this.isPowered(cpu, this.time.now) ? 52 : 0)
    if (Math.random() > profile.accuracy) {
      aim += Phaser.Math.Between(-1, 1)
    }
    return Phaser.Math.Clamp(aim, 0, AIM_LANES - 1)
  }

  private getBestAimIndexForTarget(player: PlayerState, targetX: number, targetY: number, bonusRange: number) {
    const mouth = this.getMouth(player)
    let bestAim = CENTER_AIM
    let bestDistance = Number.POSITIVE_INFINITY

    for (let aim = 0; aim < AIM_LANES; aim += 1) {
      const end = this.getAimTargetForIndex(player, aim, bonusRange)
      const distance = this.distanceToSegment(targetX, targetY, mouth.x, mouth.y, end.x, end.y)
      if (distance < bestDistance) {
        bestDistance = distance
        bestAim = aim
      }
    }

    return bestAim
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
    this.hud.primaryButton.setVisible(true).setText('PLAY AGAIN')
    this.hud.secondaryButton.setVisible(true)
    this.updateHud()
    this.playTone(330, 0.24, 'triangle', 0.035)
  }

  private drawAimGuide(player: PlayerState) {
    player.aimGuide.clear()
    if (!this.options.aimGuides) {
      return
    }

    const start = this.getMouth(player)
    const end = this.getAimTarget(player, 0)
    const guideEnd = new Phaser.Math.Vector2(
      Phaser.Math.Linear(start.x, end.x, 0.28),
      Phaser.Math.Linear(start.y, end.y, 0.28),
    )

    player.aimGuide.lineStyle(player.isCpu ? 3 : 2, player.side === 'left' ? 0xdfff9a : 0xaee8ff, player.isCpu ? 0.45 : 0.7)
    player.aimGuide.lineBetween(start.x, start.y, guideEnd.x, guideEnd.y)
    player.aimGuide.fillStyle(player.side === 'left' ? 0xdfff9a : 0xaee8ff, player.isCpu ? 0.55 : 0.8)
    player.aimGuide.fillCircle(guideEnd.x, guideEnd.y, player.isCpu ? 5 : 4)
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
    return this.getAimTargetForIndex(player, player.aimIndex, bonusRange)
  }

  private getAimTargetForIndex(player: PlayerState, aimIndex: number, bonusRange: number) {
    const xOffsets = [70, 190, 315, 455, 600 + bonusRange]
    const yOffsets = [392, 488, 548 + bonusRange, 505, 414]
    const offsetX = xOffsets[aimIndex] * player.direction
    const offsetY = yOffsets[aimIndex]
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

  private updateModeText() {
    const mode = this.options.mode === 'pvp' ? 'PLAYER VS PLAYER' : `PLAYER VS CPU - ${CPU_PROFILES[this.options.cpuDifficulty].label}`
    this.hud.modeText.setText(`${mode}  |  ${this.options.roundSeconds}s`)
  }

  private updateMenuLabels() {
    const mode = this.options.mode === 'pvp' ? 'PLAYER VS PLAYER' : 'PLAYER VS CPU'
    const cpu = CPU_PROFILES[this.options.cpuDifficulty].label
    this.menu.mainSummary.setText(`${mode}  |  ${this.options.roundSeconds}s  |  CPU ${cpu}`)
    this.menu.modeButton.setText(`MODE: ${mode}`)
    this.menu.difficultyButton.setText(`CPU DIFFICULTY: ${cpu}`)
    this.menu.roundButton.setText(`ROUND: ${this.options.roundSeconds} SECONDS`)
    this.menu.soundButton.setText(`SOUND: ${this.options.sound ? 'ON' : 'OFF'}`)
    this.menu.aimButton.setText(`AIM GUIDES: ${this.options.aimGuides ? 'ON' : 'OFF'}`)
    this.matchRemaining = this.options.roundSeconds
    this.players[1].isCpu = this.options.mode === 'cpu'
    this.players.forEach((player) => this.drawAimGuide(player))
    this.updateScoreLabels()
    this.updateHud()
  }

  private updateScoreLabels() {
    this.players.forEach((player) => {
      const cpuSuffix = player.side === 'right' && this.options.mode === 'cpu' ? ` CPU ${CPU_PROFILES[this.options.cpuDifficulty].label}` : ''
      player.scoreText.setText(`${player.name}${cpuSuffix}  ${player.score}`)
    })
  }

  private toggleMode() {
    this.options.mode = this.options.mode === 'pvp' ? 'cpu' : 'pvp'
    this.updateMenuLabels()
    this.playTone(320, 0.04, 'triangle', 0.02)
  }

  private cycleDifficulty() {
    const order: CpuDifficulty[] = ['easy', 'normal', 'elite']
    const currentIndex = order.indexOf(this.options.cpuDifficulty)
    this.options.cpuDifficulty = order[(currentIndex + 1) % order.length]
    this.updateMenuLabels()
    this.playTone(360 + currentIndex * 80, 0.04, 'triangle', 0.02)
  }

  private cycleRoundLength() {
    const currentIndex = ROUND_LENGTHS.indexOf(this.options.roundSeconds)
    this.options.roundSeconds = ROUND_LENGTHS[(currentIndex + 1) % ROUND_LENGTHS.length]
    this.updateMenuLabels()
    this.playTone(390 + currentIndex * 60, 0.04, 'triangle', 0.02)
  }

  private toggleSound() {
    this.options.sound = !this.options.sound
    this.updateMenuLabels()
    this.playTone(500, 0.05, 'sine', 0.02)
  }

  private toggleAimGuides() {
    this.options.aimGuides = !this.options.aimGuides
    this.updateMenuLabels()
    this.playTone(460, 0.05, 'sine', 0.02)
  }

  private getTutorialText() {
    return [
      'Goal: catch flies before the clock runs out. Elite flies are worth more.',
      '',
      'Rush: catch the golden firefly for longer range, faster recovery, and double points.',
      '',
      'Emerald: A / D aim across five lanes. W or Space lashes the tongue.',
      'Azure in PvP: Left / Right aim. Up or Enter lashes the tongue.',
      '',
      'PvCPU: choose Rookie, Pro, or Elite. P pauses; Esc backs out or pauses.',
    ].join('\n')
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
    if (!this.options.sound) {
      return
    }

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
