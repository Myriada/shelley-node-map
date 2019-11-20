/* ------------------------------------------
3rd Party
------------------------------------------ */
import React, { Component } from 'react'
import {
  Clock, Path
} from 'three'
import EventEmitter from 'eventemitter3'
import mixin from 'mixin'
import TWEEN from 'tween.js'

/* ------------------------------------------
Config
------------------------------------------ */
import Config from './Config'

/* ------------------------------------------
Classes
------------------------------------------ */
import RendererClass from './classes/RendererClass'
import GlobeSceneClass from './classes/GlobeSceneClass'
import IcosaSceneClass from './classes/IcosaSceneClass'
import FBOClass from './classes/FBOClass'
import QuadCameraClass from './classes/QuadCameraClass'
import CameraClass from './classes/CameraClass'
import ControlsClass from './classes/ControlsClass'
import MouseClass from './classes/MouseClass'
import TouchClass from './classes/TouchClass'
import IcosahedronClass from './classes/IcosahedronClass'
import AmbientLightClass from './classes/AmbientLightClass'
import PointLightClass from './classes/PointLightClass'
import ParticlesClass from './classes/ParticlesClass'
import GlobeClass from './classes/GlobeClass'
import MarkersClass from './classes/MarkersClass'
import PathsClass from './classes/PathsClass'

/* ------------------------------------------
Styles
------------------------------------------ */
import styles from './Main.css'

class Main extends mixin(EventEmitter, Component) {
  constructor (props) {
    super(props)

    this.config = new Config().data
    this.clock = new Clock()
  }

  componentDidMount () {
    this.initStage()
  }

  initStage () {
    GlobeSceneClass.getInstance().init()
    IcosaSceneClass.getInstance().init()
    CameraClass.getInstance().init()
    QuadCameraClass.getInstance().init()

    RendererClass.getInstance().init()

    const numPoints = this.config.scene.width * this.config.scene.height
    ParticlesClass.getInstance().init(numPoints)

    FBOClass.getInstance().init({
      width: this.config.scene.width,
      height: this.config.scene.height
    })
    ControlsClass.getInstance().init()
    MouseClass.getInstance().init()
    TouchClass.getInstance().init()
    IcosahedronClass.getInstance().init()
    GlobeClass.getInstance().init()
    AmbientLightClass.getInstance().init()
    PointLightClass.getInstance().init()
    MarkersClass.getInstance().init()
    PathsClass.getInstance().init()

    this.buildScene()
    this.addEvents()
    this.animate()
  }

  buildScene () {
    IcosaSceneClass.getInstance().scene.add(IcosahedronClass.getInstance().mesh)
    IcosaSceneClass.getInstance().scene.add(IcosahedronClass.getInstance().mesh2)
    IcosaSceneClass.getInstance().scene.add(AmbientLightClass.getInstance().light)
    IcosaSceneClass.getInstance().scene.add(PointLightClass.getInstance().light)
    IcosaSceneClass.getInstance().scene.add(MarkersClass.getInstance().mesh)
    IcosaSceneClass.getInstance().scene.add(PathsClass.getInstance().mesh)

    GlobeSceneClass.getInstance().scene.add(GlobeClass.getInstance().mesh)
  }

  animate () {
    window.requestAnimationFrame(this.animate.bind(this))
    this.renderFrame()
  }

  renderFrame () {
    const dt = this.clock.getDelta()

    TWEEN.update()

    MouseClass.getInstance().renderFrame({ dt: dt })
    TouchClass.getInstance().renderFrame({ dt: dt })
    ControlsClass.getInstance().renderFrame({ dt: dt })
    MarkersClass.getInstance().renderFrame({ dt: dt })
    PathsClass.getInstance().renderFrame({ dt: dt })
    ParticlesClass.getInstance().renderFrame({ dt: dt })

    FBOClass.getInstance().renderFrame()
  }

  addEvents () {
    window.addEventListener('resize', this.resize.bind(this), false)
    this.resize()

    RendererClass.getInstance().renderer.domElement.addEventListener('mousemove', (e) => {
      MouseClass.getInstance().onMouseMove(e)
    }, false)

    RendererClass.getInstance().renderer.domElement.addEventListener('touchmove', (e) => {
      TouchClass.getInstance().onTouchMove(e)
    }, false)
  }

  resize () {
    this.width = window.innerWidth
    this.height = window.innerHeight

    if (this.width > this.height) {
      this.width = this.height
    }

    if (this.height > this.width) {
      this.height = this.width
    }

    // if (this.width > this.config.scene.maxWidth) {
    //   this.width = this.config.scene.maxWidth
    // }

    // if (this.height > this.config.scene.maxHeight) {
    //   this.height = this.config.scene.maxHeight
    // }

    QuadCameraClass.getInstance().resize(this.width, this.height)
    CameraClass.getInstance().resize(this.width, this.height)
    RendererClass.getInstance().resize(this.width, this.height)
    FBOClass.getInstance().resize(this.width, this.height)
    ParticlesClass.getInstance().resize(this.width, this.height)

    if (this.config.post.enabled) {
      this.composer.setSize(this.width, this.height)
    }
  }

  destroy () {
    RendererClass.getInstance().dispose()
    GlobeSceneClass.getInstance().destroy()
    ControlsClass.getInstance().destroy()
    FBOClass.getInstance().destroy()

    if (this.composer) {
      delete this.composer
    }

    window.cancelAnimationFrame(this.animate)
    this.running = false
  }

  render () {
    return (
      <div className={styles.container}>
        <canvas width={this.width} height={this.height} id={this.config.scene.canvasID} />
      </div>
    )
  }
}

export default Main
