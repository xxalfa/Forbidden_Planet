
    //-------------------------------------------------
    // HEAD
    //-------------------------------------------------

    "use strict";

    const { spawn, exec } = require( 'child_process' );

    const readline = require( 'readline' );

    const auth = require( './auth' );

    const { Client, RichEmbed } = require( 'discord.js' );

    const discord = { client: new Client() };

    // discord.client.login( auth.token );

    //-------------------------------------------------
    // TABLES
    //-------------------------------------------------

    const table_of_stages = {};

    table_of_stages.start = `Server was **Started** by __USER__`;

    table_of_stages.stop = `Server was **Stopped** by __USER__`;

    table_of_stages.restart = `Server was **Restarted** by __USER__`;

    table_of_stages.update = `Server was **Updated** to __VERSION__ by __USER__`;

    table_of_stages.online = `Players **Online** __ONLINE__`;

    table_of_stages.error = `\`\`\`__ERROR__\`\`\``;

    const table_of_commands = {};

    table_of_commands.start = { parameters: '*<**new** | **latest**>* *default:* **latest**', information: 'starts the server', usage: '!start latest', permissions: '@Trusted' };

    table_of_commands.stop = { parameters: '', information: 'stops the server', usage: '!stop', permissions: '@Moderator' };

    table_of_commands.restart = { parameters: '*<**new** | **latest**>* *default:* **latest**', information: 'restarts the server', usage: '!restart', permissions: '@Moderator' };

    table_of_commands.online = { parameters: '', information: 'Logs the current online player count', usage: '!online', permissions: '@Everyone' };

    table_of_commands.server = { parameters: '', information: 'List server information', usage: '!server', permissions: '@Everyone' };

    table_of_commands.kick = { parameters: '*<**name**>*', information: 'Kicks a player from the server', usage: '!kick Banana', permissions: '@Moderator' };

    table_of_commands.ban = { parameters: '*<**name**>*', information: 'Bans a player from the server', usage: '!ban Banana', permissions: '@Moderator' };

    table_of_commands.unban = { parameters: '*<**name**>*', information: 'Un-bans a player from the server', usage: '!unban Banana', permissions: '@Moderator' };

    table_of_commands.promote = { parameters: '*<**name**>*', information: 'Promotes a in-game player to *Admin*', usage: '!promote Banana', permissions: '@Administrator' };

    table_of_commands.demote = { parameters: '*<**name**>*', information: 'Demotes a in-game player', usage: '!demote Banana', permissions: '@Administrator' };

    const table_of_ranks = [ 'Administrator', 'Moderator', 'Trusted', 'Everyone' ];

    //-------------------------------------------------
    // CLASS EVENT
    //-------------------------------------------------

    class Event
    {
        constructor()
        {
            this.events = {};
        }

        register( name, callback )
        {
            this.events[ name ] = callback;
        }

        trigger( name )
        {
            console.log( `trigger: ${name}` );

            if ( this.events[ name ] )
            {
                this.events[ name ]();
            }
        }
    }

    const event = new Event();

    //-------------------------------------------------
    // CLASS FACTORIO SERVER
    //-------------------------------------------------

    class FactorioServer
    {
        constructor( opts )
        {
            this.process = undefined;

            this._online = false;

            const table_of_objects = {};

            table_of_objects.launch = {};

            table_of_objects.launch.path = '/opt/factorio/bin/x64/factorio';

            table_of_objects.launch.latest = '--start-server-load-latest';

            table_of_objects.launch.new = '--start-server-load-scenario';

            table_of_objects.launch.name = 'ComfyFactorio';

            table_of_objects.launch.config = '/opt/factorio/config/server-settings.json';

            this.options = Object.assign( table_of_objects, opts );
        }

        start( parameter = 'latest' )
        {
            return new Promise( ( resolve, reject ) =>
            {
                if ( parameter == false )
                {
                    reject( 'no start parameter' );
                }

                const { options } = this;

                if ( parameter == 'new' )
                {
                    this.process = spawn( options.launch.path, [ options.launch.new, options.launch.name, '--server-settings', options.launch.config ] );

                    this._set_triggers( this.process );
                }
                else if ( parameter == 'latest' )
                {
                    this.process = spawn( options.launch.path, [ options.launch.latest, '--server-settings', options.launch.config ] );

                    this._set_triggers( this.process );
                }
                else
                {
                    reject( 'unknown parameter' );
                }

                resolve( 'started' );

            } )
        }

        stop()
        {
            return new Promise( ( resolve, reject ) =>
            {
                if ( this.process == false )
                {
                    message_embedded( 'bananas', 'Error', 'Server is currently not running', 0xff0000 );

                    reject( 'server not running' );

                    return;
                }

                this.process.kill( 'SIGHUP' );

                resolve( 'stopped' );

            } )
        }

        online_players()
        {
            if ( this.process == false )
            {
                return;
            }

            this.process.stdin.write( `/silent-command log( "[ONLINE] " .. #game.connected_players )\n` );
        }

        restart()
        {

        }

        message( user, text )
        {
            if ( this.process == false )
            {
                return;
            }

            this.process.stdin.write( `/silent-command game.print( "[Discord] ${user}: ${text}", { r = 0.4, g = 0.6, b = 1 } )\n` );
        }

        set online( o )
        {
            this._online = o;
        }

        get online()
        {
            return this._online;
        }

        _set_triggers( factorio_server_process )
        {
            factorio_server_process.stdout.on( 'data', data =>
            {
                console.log( `${data}` );

                // const error_filter = /.*Error(.*)/;

                // const error = error_filter.exec( `${data}` );

                // const started = /.*ServerMultiplayerManager.cpp:705: Matching server connection resumed.*/;

                // const message_filter = /.*\[CHAT\]\s?(.*)/;

                // const online_players_filter = /.*Script log.*\[ONLINE\]\s?(\d+)/;

                // const join_filter = /.*\[JOIN\]\s?(.*)/;

                // const leave_filter = /.*\[LEAVE\]\s?(.*)/;

                // const join = join_filter.exec( `${data}` );

                // const leave = leave_filter.exec( `${data}` );

                // const message = message_filter.exec( `${data}` );

                // const online = online_players_filter.exec( `${data}` );

                // if ( error )
                // {
                //     message_embedded( 'bananas', 'Error', table_of_stages.error.replace( '__ERROR__', error[ 1 ] ), 0xff0000 );
                // }

                // if ( started.test( data ) )
                // {
                //     event.trigger( 'started' );

                //     factorio.server.online = true;
                // }

                // if ( join )
                // {
                //     const user = join[ 1 ].split( ' ' )[ 0 ];

                //     join_or_leave_message( 'bananas', user, 'joined' );
                // }
                // else if ( leave )
                // {
                //     const user = leave[ 1 ].split( ' ' )[ 0 ];

                //     join_or_leave_message( 'bananas', user, 'left' );
                // }
                // else if ( message )
                // {
                //     const data = message[ 1 ].split( ' ' );

                //     const user = data[ 0 ];

                //     const text = data.slice( 1, data.length );

                //     chat_message( 'bananas', user, text.join( ' ' ) );
                // }
                // else if ( online )
                // {
                //     message_embedded( 'bananas', 'Status', table_of_stages.online.replace( '__ONLINE__', online[ 1 ] ), 0x0000ff );
                // }

            } )

            factorio_server_process.on( 'close', ( code ) =>
            {
                event.trigger( 'stop' );

                factorio.server.online = false;

            } );

            factorio_server_process.on( 'error', ( err ) =>
            {
                console.log( 'Failed to start sub_process.' );

            } );

            process.on( 'SIGINT', async () =>
            {
                console.log( 'Caught interrupt signal.' );

                factorio_server_process.kill( 'SIGHUP' );

                this.process = undefined;

                setTimeout( () => process.exit(), 1000 );

            } );

        }
    }

    const factorio = { server: new FactorioServer() };

    factorio.server.start( 'new' );

    //-------------------------------------------------
    // DISCORD CLIENT ON MESSAGE
    //-------------------------------------------------

    discord.client.on( 'message', async message =>
    {
        if ( message.author.bot )
        {
            return;
        }

        if ( message.type != 'DEFAULT' )
        {
            return;
        }

        if ( message.channel.name !== 'bananas' )
        {
            return;
        }

        const message_author = message.author.username

        if ( message.content.startsWith( '!' ) )
        {
            if ( check_permissions( 'Everyone', message ) == false )
            {
                return;
            }

            if ( message.content.startsWith( '!help' ) )
            {
                print_help( 'bananas' );
            }

            if ( message.content.startsWith( '!server' ) )
            {
                message_embedded( 'bananas', 'Server Info', `3 Cores @ 3,90 GHz\n8 GB RAM\n**OS** Linux` );
            }

            const parameter = message.content.split( /\s/g )[ 1 ];

            if ( message.content.startsWith( '!online' ) )
            {
                factorio.server.online_players();
            }
            else if ( message.content.startsWith( '!start' ) )
            {
                if ( factorio.server.online )
                {
                    message_embedded( 'bananas', 'Error', 'Server is currently running', 0xff0000 );
                }
                else
                {
                    event.register( 'started', () => { message_embedded( 'bananas', 'Status', table_of_stages.start.replace( '__USER__', message_author ), 0x00ff00 ) } );

                    await factorio.server.start( 'new' );
                }
            }
            else if ( message.content.startsWith( '!stop' ) )
            {
                if ( factorio.server.online == false )
                {
                    message_embedded( 'bananas', 'Error', 'Server is currently not running', 0xff0000 );
                }
                else
                {
                    await factorio.server.stop();

                    event.register( 'stop', () => { message_embedded( 'bananas', 'Status', table_of_stages.stop.replace( '__USER__', message_author ), 0xff0000 ) } );
                }
            }
            else if ( message.content.startsWith( '!restart' ) )
            {
                message_embedded( 'bananas', 'Status', table_of_stages.restart.replace( '__USER__', message_author ), 0xffff00 );
            }
            else if ( message.content.startsWith( '!kick' ) )
            {

            }
            else if ( message.content.startsWith( '!ban' ) )
            {

            }
            else if ( message.content.startsWith( '!unban' ) )
            {

            }
            else if ( message.content.startsWith( '!promote' ) )
            {

            }
            else if ( message.content.startsWith( '!demote' ) )
            {

            }
        }
        else
        {
            if ( factorio.server.online == false )
            {
                return;
            }

            const text = escape_string( message.cleanContent );

            factorio.server.message( message.author.username, text );
        }

    } );

    //-------------------------------------------------
    // CODE
    //-------------------------------------------------

    const escape_string = message =>
    {
        let escaped = message.replace( /\n/g, '' );

        escaped = escaped.replace( /(["'\\])/g, "\\$1" );

        return escaped;
    }

    const check_permissions = ( permission, message ) =>
    {
        const user_roles = message.member.roles.first( 1 )[ 0 ].name;

        console.log( user_roles );

        /*

        const userRank = table_of_ranks.indexOf( userRankName );

        const requiredRank = table_of_ranks.indexOf( permission );

        message.reply( `User Rank: ${userRank}, required: ${requiredRank}` );

        */
    }

    const message_embedded = ( channel_name, title, message, color = 0xff0000 ) =>
    {
        const bananas = discord.client.channels.find( channel => channel.name === channel_name );

        if ( bananas == false )
        {
            return;
        }

        const embed = new RichEmbed().setTimestamp().setTitle( `**${title}**` ).setColor( color ).setDescription( message );

        bananas.send( embed );
    }

    const join_or_leave_message = ( channel_name, user, join_or_leave ) =>
    {
        const bananas = discord.client.channels.find( channel => channel.name === channel_name );

        if ( bananas == false )
        {
            return;
        }

        bananas.send( `**⟶ ${user} ${join_or_leave} the server ⟵**` );
    }

    const chat_message = ( channel_name, user, message ) =>
    {
        const bananas = discord.client.channels.find( channel => channel.name === channel_name );

        if ( bananas == false )
        {
            return;
        }

        const msg = `**${user}** *${message}*`;

        bananas.send( msg );
    }

    const print_help = ( channel_name ) =>
    {
        const bananas = discord.client.channels.find( channel => channel.name === channel_name );

        if ( bananas == false )
        {
            return;
        }

        let string = '';

        for ( let [ name, value ] of Object.entries( table_of_commands ) )
        {
            string += `**!${name}** ${value.parameters}\n\t↳ ${value.information}\n\t↳ Usage: \`${value.usage}\`\n↳Permissions: **${value.permissions}**\n\n`;
        }

        message_embedded( 'bananas', 'Commands', string, 0xaa55ff );
    }

    /*

    setTimeout( () =>
    {
        message_embedded("announcements",table_of_stages.start.replace('__USER__', 'Decu'), 0x00ff00);

        message_embedded("announcements",table_of_stages.stop.replace('__USER__', 'Decu'), 0xff0000);

        message_embedded("announcements",table_of_stages.restart.replace('__USER__', 'Decu'), 0xffff00);

        message_embedded("announcements",table_of_stages.update.replace('__USER__', 'Decu').replace('__VERSION__', '*0.17.49*'), 0xff00ff);

        message_embedded("announcements",table_of_stages.online.replace('__ONLINE__', 12), 0x0000ff);

    }, 1000 )

    setInterval(() => join_or_leave_message("bananas"), 5000);

    setInterval(() => chat_message("bananas"), 2500);

    */
