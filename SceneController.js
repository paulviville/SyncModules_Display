import * as THREE from './three/three.module.js';
import { OrbitControls } from './three/controls/OrbitControls.js';
import CameraController from './SyncModulesViews/Controllers/CameraController.js';
import TransformController from './SyncModulesViews/Controllers/TransformController.js';
import { TransformControls } from "controls/TransformControls.js";
import SceneGraphController from './SyncModulesViews/Controllers/SceneGraphController.js';


export default class SceneController {
	#renderer;
	#scene;
	#camera;
	#cameraController;
	#transformController;
	#orbitControls;
	#sceneGraphController;

	constructor ( ) {
		console.log( `SceneController - constructor` );
		
		this.#renderer = new THREE.WebGLRenderer({antialias: true});
		this.#renderer.autoClear = false;
		this.#renderer.setPixelRatio( window.devicePixelRatio );
		this.#renderer.setSize( window.innerWidth, window.innerHeight );
		document.body.appendChild( this.#renderer.domElement );

		this.#scene = new THREE.Scene( );
        this.#scene.background = new THREE.Color(0xcccccc);
		this.#camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.1, 100 );
		this.#camera.position.set( -2, 3, -3 );
		this.#cameraController = new CameraController( this.#camera, this.#renderer.domElement );
		this.#transformController = new TransformController( this.#camera, this.#renderer.domElement );
		this.#scene.add( this.#transformController.getHelper( ) );
		this.#scene.add( this.#transformController.object3D );
		this.#transformController.addEventListener( 'dragging-changed', event => this.#cameraController.enabled = !event.value );
		
		this.#sceneGraphController = new SceneGraphController( this.#camera, this.#renderer.domElement );
		this.#scene.add( this.#sceneGraphController.getHelper( ) );
		this.#scene.add( this.#sceneGraphController.object3D );
		this.#sceneGraphController.addEventListener( 'dragging-changed', event => this.#cameraController.enabled = !event.value );

		// this.#orbitControls = new OrbitControls( this.#camera, this.#renderer.domElement);
		// console.log(this.#orbitControls)
		const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
		this.#scene.add(ambientLight);
		const pointLight = new THREE.PointLight( 0xffffff, 120);
		pointLight.position.set(-2, 3, -4);
		this.#scene.add(pointLight);
		this.#addDebug( );



		window.onresize = this.#onWindowResize.bind( this );
	}



	#addDebug ( ) {
		const axesHelper = new THREE.AxesHelper( );
		this.#scene.add( axesHelper );
		const gridHelper = new THREE.GridHelper( );
		this.#scene.add( gridHelper );

		// const divs = 10;
		// const sphereGroup = new THREE.Group( );
		// const sphereGeometry = new THREE.SphereGeometry( 0.1, 16, 16 );
		// for ( let i = 0; i < divs; ++i ) {
		// 	for ( let j = 0; j < divs; ++j ) {
		// 		for ( let k = 0; k < divs; ++k ) {
		// 			const material = new THREE.MeshPhongMaterial( { color: new THREE.Color( i / divs, j / divs, k / divs) } );
		// 			const sphere = new THREE.Mesh( sphereGeometry, material)
		// 			sphereGroup.add( sphere );
		// 			sphere.position.set( -5 + ( 10 / divs ) *i, -5 + ( 10 / divs ) *j, -5 + ( 10 / divs ) *k )
		// 		} 
		// 	} 
		// }
		// this.#scene.add( sphereGroup );
	}

	#onWindowResize ( ) {
		// this.#camera.aspect = window.innerWidth / window.innerHeight;
		// this.#camera.updateProjectionMatrix();

		this.#renderer.setSize(window.innerWidth, window.innerHeight);
	}

	#animate ( ) {
		this.#renderer.render(this.#scene, this.#camera);
	}

	startRender ( ) {
		this.#renderer.setAnimationLoop( this.#animate.bind(this) );
	}

	stopRender ( ) {
		this.#renderer.setAnimationLoop(null);
	}

	get camera ( ) {
		return this.#camera;
	}

	get scene ( ) {
		return this.#scene;
	}
}