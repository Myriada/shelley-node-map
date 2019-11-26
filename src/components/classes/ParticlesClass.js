import {
  Vector2,
  InstancedBufferGeometry,
  InstancedBufferAttribute,
  Mesh,
  ShaderLib,
  ShaderMaterial,
  PlaneBufferGeometry,
  AdditiveBlending,
  Scene,
  WebGLRenderTarget,
  ClampToEdgeWrapping,
  NearestFilter,
  RGBAFormat,
  OrthographicCamera
} from 'three'

import BaseClass from './BaseClass'
import MouseClass from './MouseClass'

// shaders
import fragmentShader from '../../shaders/particles.frag'
import vertexShader from '../../shaders/particles.vert'
import PassThroughVert from '../../shaders/passThrough.vert'
import PositionFrag from '../../shaders/position.frag'
import PassThroughFrag from '../../shaders/passThrough.frag'

import TextureHelper from '../../helpers/TextureHelper'
import RendererClass from './RendererClass'
import FBOClass from './FBOClass'

class ParticlesClass extends BaseClass {
  init (numPoints = 100) {
    this.mouseMoved = 1
    this.frame = 0

    this.particleCount = Math.round(numPoints / 6)

    this.textureHelper = new TextureHelper({
      config: this.config
    })
    this.textureHelper.setTextureSize(this.particleCount)

    this.material = new ParticlesMaterial({
      transparent: true,
      blending: AdditiveBlending
    })
    this.material.uniforms.uTextureSize = { value: new Vector2(this.config.scene.width, this.config.scene.height) }

    this.geometry = new InstancedBufferGeometry()
    const refGeo = new PlaneBufferGeometry(1, 1)
    this.geometry.addAttribute('position', refGeo.attributes.position)

    this.geometry.addAttribute('uv', refGeo.attributes.uv)
    this.geometry.setIndex(refGeo.index)

    this.offsets = new Float32Array(this.particleCount * 3)

    let step = 6
    for (let i = 0; i < numPoints; i++) {
      this.offsets[i * 3 + 0] = (i * step) % this.config.scene.width
      this.offsets[i * 3 + 1] = Math.floor((i * step) / this.config.scene.width)
      this.offsets[i * 3 + 2] = 0
    }

    this.geometry.addAttribute('offset', new InstancedBufferAttribute(this.offsets, 3, false))

    const positionArray = new Float32Array(this.particleCount * 3)

    this.setTextureLocations(
      this.particleCount,
      positionArray
    )

    const tPosition = new InstancedBufferAttribute(positionArray, 3)
    this.geometry.addAttribute('tPosition', tPosition)

    this.mesh = new Mesh(this.geometry, this.material)

    this.mesh.position.z = 0.1

    this.positionMaterial = new ShaderMaterial({
      uniforms: {
        positionTexture: {
          type: 't',
          value: null
        },
        defaultPositionTexture: {
          type: 't',
          value: null
        },
        initialPositionTexture: {
          type: 't',
          value: null
        },
        uNoiseMix: {
          type: 'f',
          value: 1.0
        },
        uFrame: {
          type: 'f',
          value: 0.0
        },
        uMousePos: {
          type: 'v2',
          value: new Vector2(0, 0)
        },
        uPrevMousePos: {
          type: 'v2',
          value: new Vector2(0, 0)
        }
      },
      vertexShader: PassThroughVert,
      fragmentShader: PositionFrag
    })

    this.initCamera()
    this.initPassThrough()
    this.initRenderTargets()
    this.initPositions()

    // super.init()
  }

  initPassThrough () {
    this.passThroughScene = new Scene()
    this.passThroughMaterial = new ShaderMaterial({
      uniforms: {
        texture: {
          type: 't',
          value: null
        }
      },
      vertexShader: PassThroughVert,
      fragmentShader: PassThroughFrag
    })
    const mesh = new Mesh(new PlaneBufferGeometry(2, 2), this.passThroughMaterial)
    mesh.frustumCulled = false
    this.passThroughScene.add(mesh)
  }

  initRenderTargets () {
    this.positionRenderTarget1 = new WebGLRenderTarget(this.textureHelper.textureWidth, this.textureHelper.textureHeight, {
      wrapS: ClampToEdgeWrapping,
      wrapT: ClampToEdgeWrapping,
      minFilter: NearestFilter,
      magFilter: NearestFilter,
      format: RGBAFormat,
      type: this.config.floatType,
      depthWrite: false,
      depthBuffer: false,
      stencilBuffer: false
    })

    this.positionRenderTarget2 = this.positionRenderTarget1.clone()

    this.outputPositionRenderTarget = this.positionRenderTarget1
  }

  initPositions () {
    this.renderer = RendererClass.getInstance().renderer

    const positionData = this.textureHelper.createPositionTexture()
    this.defaultPositionTexture = positionData.positionTexture
    this.initialPositionTexture = positionData.initialPositionTexture

    // this.passThroughTexture(positionData.positionTexture, this.positionRenderTarget1)
    // this.passThroughTexture(this.positionRenderTarget1.texture, this.positionRenderTarget2)

    this.positionMaterial.uniforms.defaultPositionTexture.value = this.defaultPositionTexture
    this.material.uniforms.defaultPositionTexture.value = this.defaultPositionTexture

    this.positionMaterial.uniforms.initialPositionTexture.value = this.initialPositionTexture
    this.material.uniforms.initialPositionTexture.value = this.initialPositionTexture

    this.positionScene = new Scene()

    this.positionMesh = new Mesh(new PlaneBufferGeometry(2, 2), this.positionMaterial)
    this.positionMesh.frustumCulled = false
    this.positionScene.add(this.positionMesh)
  }

  initCamera () {
    this.quadCamera = new OrthographicCamera()
    this.quadCamera.position.z = 1
  }

  passThroughTexture (input, output) {
    this.passThroughMaterial.uniforms.texture.value = input
    this.renderer.setRenderTarget(output)
    this.renderer.render(this.passThroughScene, this.quadCamera)
  }

  updatePositions () {
    let inputPositionRenderTarget = this.positionRenderTarget1
    this.outputPositionRenderTarget = this.positionRenderTarget2
    if (this.frame % 2 === 0) {
      inputPositionRenderTarget = this.positionRenderTarget2
      this.outputPositionRenderTarget = this.positionRenderTarget1
    }
    this.positionMaterial.uniforms.positionTexture.value = inputPositionRenderTarget.texture

    this.renderer.setRenderTarget(this.outputPositionRenderTarget)
    this.renderer.render(this.positionScene, this.quadCamera)

    this.material.uniforms.positionTexture.value = this.outputPositionRenderTarget.texture
  }

  setTextureLocations (
    nodeCount,
    positionArray
  ) {
    for (let i = 0; i < nodeCount; i++) {
      const textureLocation = this.textureHelper.getNodeTextureLocation(i)
      positionArray[i * 3 + 0] = textureLocation.x
      positionArray[i * 3 + 1] = textureLocation.y
    }
  }

  renderFrame (args) {
    this.frame++

    this.material.uniforms.uTime.value += args.dt

    this.positionMaterial.uniforms.uFrame.value = this.frame
    this.positionMaterial.uniforms.uMousePos.value = MouseClass.getInstance().normalizedMousePos
    this.positionMaterial.uniforms.uPrevMousePos.value = MouseClass.getInstance().prevNormalizedMousePos

    this.material.uniforms.uMousePos.value = MouseClass.getInstance().normalizedMousePos
    this.material.uniforms.uPrevMousePos.value = MouseClass.getInstance().prevNormalizedMousePos

    this.material.uniforms.uMousePosTexture.value = FBOClass.getInstance().mousePosTexture

    this.updatePositions()

    if (Math.abs(MouseClass.getInstance().mouseDelta.x) + Math.abs(MouseClass.getInstance().mouseDelta.y) > 1.0) {
      this.mouseMoved = 1.0
    }

    if (this.mouseMoved > 0) {
      this.mouseMoved -= args.dt * 0.7
    }
    if (this.mouseMoved < 0) {
      this.mouseMoved = 0
    }

    this.material.uniforms.uNoiseMix.value = this.mouseMoved
    this.positionMaterial.uniforms.uNoiseMix.value = this.mouseMoved

    super.renderFrame()
  }
}

class ParticlesMaterial extends ShaderMaterial {
  constructor (config) {
    super(config)
    this.type = 'ShaderMaterial'

    this.uniforms = ShaderLib.standard.uniforms

    this.uniforms.uTexture = { value: null }
    this.uniforms.uMousePosTexture = { value: null }
    this.uniforms.uTime = { value: 0.0 }
    this.uniforms.positionTexture = {
      type: 't',
      value: null
    }
    this.uniforms.initialPositionTexture = {
      type: 't',
      value: null
    }
    this.uniforms.defaultPositionTexture = {
      type: 't',
      value: null
    }
    this.uniforms.uMousePos = {
      type: 'v2',
      value: new Vector2(0, 0)
    }
    this.uniforms.uPrevMousePos = {
      type: 'v2',
      value: new Vector2(0, 0)
    }
    this.uniforms.uNoiseMix = {
      type: 'f',
      value: 0.0
    }

    this.vertexShader = vertexShader
    this.fragmentShader = fragmentShader
    this.lights = true
  }
}

export default ParticlesClass
