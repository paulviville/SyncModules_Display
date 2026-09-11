import ClientManager from "./ClientManager.js";
import ClientNetwork from "./ClientNetwork.js";
import ViewsRegistry from "./SyncModulesViews/ViewsRegistry.js";
import SceneController from "./SceneController.js";
import CameraController from "./SyncModulesViews/Controllers/CameraController.js";

import * as THREE from "./three/three.module.js";

const params = new URLSearchParams(window.location.search);
console.log(params)
const windowId = parseInt( params.get("id") );

console.log(windowId);
let windowUUID = params.get("UUID");
console.log(windowUUID)
if ( windowUUID === null || windowUUID === undefined ) {
	windowUUID = crypto.randomUUID( );
	const url = new URL(window.location);
	url.searchParams.set( "UUID", windowUUID );
	console.log( url )
	history.replaceState({}, "", url);
}


const clientManager = new ClientManager( );

const sceneController = clientManager.sceneController;


window.clientManager = clientManager;
window.addEventListener("beforeunload", (event) => { clientManager.beforeUnload( event ) } );




const displayGeometries = [
	[
		[ 0.5, -0.5, 1.5 ],
		[ -0.5, -0.5, 1.5 ],
		[ 0.5, 0.5, 1.5 ],
		[ -0.5, 0.5, 1.5 ],
	],
	[
		[ 0.5, 0.75, 1.5 ],
		[ -0.5, 0.75, 1.5 ],
		[ 0.5, 1.75, 1.0 ],
		[ -0.5, 1.75, 1.0 ],
	],
	[
		[ -0.75, -0.5, 1.5 ],
		[ -1.75, -0.5, 1.0 ],
		[ -0.75, 0.5, 1.5 ],
		[ -1.75, 0.5, 1.0 ],
	],
]



let displayModule;
let UUID;
function setDisplay ( id = 0 ) {
	if ( displayModule === undefined )
		return;


	displayModule.setOnChange( displayModule.commands.setMatrices, ( matrices ) => {
		if ( matrices.UUID != windowUUID ) {
			return;
		}

		const camera = sceneController.camera;
		camera.matrixAutoUpdate = false;
		camera.matrixWorldInverse.fromArray( matrices.view );
		camera.matrixWorld.fromArray( matrices.view ).invert( );
		camera.projectionMatrix.fromArray( matrices.projection );
		camera.projectionMatrixInverse.fromArray( matrices.projection ).invert( );
	} );

	displayModule.addDisplay( {
		label: `display ${ id }`,
		UUID: windowUUID,
		corners: displayGeometries[ id ],
	}, true );
}

clientManager.modulesRegistry.setOnChange( "ADD_MODULE", ( moduleData ) => {
	if( moduleData.type == "DisplaysModule" ) {
		displayModule = clientManager.modulesRegistry.getModule( moduleData.UUID );



		setDisplay( windowId );
	}
} );

window.addEventListener("beforeunload", ( ) => { 
	// if ( ) {}
} );



clientManager.connect("ws://130.79.90.188");
