import ClientNetwork from "./ClientNetwork.js";
import ModulesRegistry from "./SyncModules/Core/ModulesRegistry.js";
import ViewsRegistry from "./SyncModulesViews/ViewsRegistry.js";
import SceneController from "./SceneController.js";
import PrimitiveModule from "./SyncModules/PrimitiveModule.js";

const SCOPES = {
	SYSTEM: "SYSTEM",
	INSTANCE: "INSTANCE",
	MODULE: "MODULE",
};
const INSTANCE_COMMANDS = {
	INSTANCE_LIST: "INSTANCE_LIST",
	INSTANCE_ADD: "INSTANCE_ADD",
	INSTANCE_REMOVE: "INSTANCE_REMOVE",
	INSTANCE_JOIN: "INSTANCE_JOIN",
	INSTANCE_LEAVE: "INSTANCE_LEAVE",
	INSTANCE_CLEAR: "INSTANCE_CLEAR",
	OWNERSHIP: "OWNERSHIP", /// declare the ownership of a module
}

function uuid( ) {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
}

export default class ClientManager {
	#UUID = uuid();
	#clientNetwork = new ClientNetwork( this.#UUID );
	#modulesRegistry;
	#viewsRegistry;
	#sceneController = new SceneController( );
	#modulesOwned = new Set( ); /// UUIDs

	#sendFn;

	constructor ( ) {
		
		this.#sendFn = this.#clientNetwork.send;

		this.#modulesRegistry = new ModulesRegistry ( 
			( payload ) => {
				const message = this.#createMessage( SCOPES.MODULE, payload );
				this.#sendFn( message );
		} );
		this.#viewsRegistry = new ViewsRegistry( this.#modulesRegistry );
		this.#sceneController.scene.add( this.#viewsRegistry );
		this.#sceneController.startRender( );
				
		this.#clientNetwork.setCallbacks( {
			onOpen: ( ) => {
				this.#sendFn( JSON.stringify( { UUID: this.#UUID } ) );

				/// debug
				const registryState = this.#modulesRegistry.outputState( );
				console.log(registryState)
				const stateBuffer = this.#bufferizeRegistryState( );


				const message = this.#createMessage(SCOPES.SYSTEM, {
					command: INSTANCE_COMMANDS.INSTANCE_JOIN,
					data: {
						instanceUUID: "00000000-0000-0000-0000-000000000000",
						userUUID: this.#UUID,
					},
				});
				this.#sendFn( message );

				for ( const state of stateBuffer ) {
					const message = this.#createMessage( SCOPES.MODULE, state );
					this.#sendFn( message );
				}

			},

			onMessage: ( message ) => {
				const messageData = JSON.parse( message );
				const { scope, senderUUID, payload } = messageData;
				switch ( scope ) {
					case SCOPES.MODULE:
						this.#onModuleMessage( payload );
						break;
				}
			},
		} );
	}

	connect ( url = "ws://localhost", port = "3000" ) {
		this.#clientNetwork.connect( url, port );
	}

	/// Debug
	get clientNetwork ( ) {
		return this.#clientNetwork;
	}

	get modulesRegistry ( ) {
		return this.#modulesRegistry;
	}

	get viewsRegistry ( ) {
		return this.#viewsRegistry;
	}

	get UUID ( ) {
		return this.#UUID;
	}

	#createMessage ( scope, payload ) {
		const messageData = {
			scope,
			senderUUID: this.#UUID,
			payload,
		};

		return JSON.stringify( messageData );
	}

	#onModuleMessage ( payload ) {
		const { moduleUUID } = payload;
		const module = this.#modulesRegistry.getModule( moduleUUID );
		module.input( payload );
	}

	addModule ( type, sync = false, own = false, view = true ) {
		const UUID = uuid();
		const module = this.#modulesRegistry.addModule( type, UUID, sync );
		
		if ( !view ) {
			const moduleView = this.#viewsRegistry.getView( UUID );
			moduleView.visible = false;
		}

		if ( own ) {
			this.#modulesOwned.add( UUID );
		}

		return module;
	}

	removeModule ( moduleUUID, sync = false ) {
		this.#modulesRegistry.removeModule( moduleUUID, sync );

		if ( this.#modulesOwned.has( moduleUUID ) ) {
			this.#modulesOwned.delete( moduleUUID );
		}
	}

	beforeUnload ( event ) {
		this.#modulesOwned.forEach( moduleUUID => this.removeModule( moduleUUID, true ) );
	}

	#bufferizeRegistryState ( ) {
		const stateBuffer = [];
		for ( const [ UUID, module ] of this.#modulesRegistry.modules ) {
			stateBuffer.push( module.outputState( ) )
		}
		return stateBuffer;
	}

	get sceneController ( ) {
		return this.#sceneController;
	}
}