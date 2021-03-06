
    import Events from 'events';

    import net from 'net';

    import auth from '../auth';

    const SERVERDATA_RESPONSE_VALUE = 0x00;

    const SERVERDATA_AUTH_RESPONSE = 0x02;

    const SERVERDATA_EXECCOMMAND = 0x02;

    const SERVERDATA_AUTH = 0x03;

    const REMOTE_CONNECTION_CONFIG = { host: 'SERVER_ADDRESS', port: '3001', password: auth.rcon };

    class RemoteConnection extends Events
    {
        constructor( opts )
        {
            super();

            this.options = Object.assign( { host: '', port: '', password: '', timeout: 2e3, }, opts );

            this.authenticated = false;

            this.awaiting = {};
        }

        connect()
        {
            const { port, host, password } = this.options;

            return new Promise( ( resolve, reject ) => { this.connection = net.createConnection( port, host ).on( 'data', d => { console.log( 'data' ) this.request_response( d ) } ).on( 'connect', () => { this.send( password, SERVERDATA_AUTH ).then( () => { this.emit( 'connect' ) this.authenticated = true resolve() } ).catch( error => reject( new Error( { error, message: 'Authentication failed :(' } ) ) ) } ).on( 'error', e => this.emit( error ) ).on( 'end', () => this.emit( 'end' ) ) } )
        }

        disconnect()
        {
            const { connection } = this;

            if ( connection )
            {
                connection.end();
            }
        }

        send( data, packetType )
        {
            return new Promise( ( resolve, reject ) => {

                const { authenticated, connection } = this;

                const { timeout } = this.options;

                if ( authenticated == false && packetType !== SERVERDATA_AUTH )
                {
                    throw new Error( 'You are not authenticated.' );
                }

                const length = Buffer.byteLength( data );

                const id = Math.trunc( Math.random() * 0xFFFF ) << 4;

                const buffer = new Buffer.allocUnsafe( length + 14 );

                buffer.writeInt32LE( length + 10, 0 );

                buffer.writeInt32LE( id, 4 );

                buffer.writeInt32LE( packetType, 8 );

                buffer.write( data, 12 );

                buffer.fill( 0x00, length + 12 );

                connection.write( buffer.toString( 'binary' ), 'binary' );

                const timeoutId  = setTimeout( () => { reject( new Error( { message: 'request timeout' } ) ) }, timeout );

                this.awaiting[ id ] = ( () => { resolve() clearTimeout( timeoutId ) } ).bind( this );

            } );
        }

        request_response( buffer )
        {
            const length = buffer.readInt32LE( 0 );

            const id = buffer.readInt32LE( 4 );

            const type = buffer.readInt32LE( 8 );

            if ( type === SERVERDATA_AUTH_RESPONSE )
            {
                if ( this.awaiting[ id ] )
                {
                    this.awaiting[ id ]();

                    delete this.awaiting[ id ];
                }

                this.emit( 'auth' );
            }
            else if ( type === SERVERDATA_RESPONSE_VALUE )
            {
                if ( this.awaiting[ id ] )
                {
                    this.awaiting[ id ]();

                    delete this.awaiting[ id ];
                }
                else
                {
                    console.log( 'actual data' );

                    this.emit( 'data', buffer.toString( 'ascii', 12, buffer.length - 2 ) );
                }
            }
        }
    }

    const main = async () =>
    {
        const remote_connection = new RemoteConnection( REMOTE_CONNECTION_CONFIG );

        remote_connection.on( 'connect', () => console.log( 'is connected' ) );

        remote_connection.on( 'data', ( data ) => console.log( data ) );

        await remote_connection.connect().catch( exception => console.error );

        await remote_connection.send( 'test 1', SERVERDATA_EXECCOMMAND );

        await remote_connection.send( 'test 2', SERVERDATA_EXECCOMMAND );

        await remote_connection.send( 'test 3', SERVERDATA_EXECCOMMAND );

        await remote_connection.send( 'test 4', SERVERDATA_EXECCOMMAND );
    }

    main().catch( exception => console.log( exception.message ) );
