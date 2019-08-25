
    //-------------------------------------------------
    // HEAD
    //-------------------------------------------------

    "use strict";

    const fs = require( 'fs' );

    const sleep = require( 'sleep' );

    const { spawn, exec } = require( 'child_process' );

    const auth = require( './auth' );

    const { Client, RichEmbed } = require( 'discord.js' );

    const discord = { client: new Client() };

    // discord.client.login( auth.token );

    //-------------------------------------------------
    // TABLES
    //-------------------------------------------------

    const table_of_ranks = [ 'Administrator', 'Moderator', 'Trusted', 'Everyone' ];

    const table_of_images = [ 'factoriotools/factorio' ];

    const table_of_scenarios = [];

    // table_of_scenarios[ 0 ] = { community: '[color=blue]~COMFY~[/color]', name: 'Tank Conquest', description: 'Drive and shoot.', tags: undefined };

    // table_of_scenarios[ 1 ] = { community: '[color=blue]~COMFY~[/color]', name: 'Biter Battles', description: 'Fight.', tags: undefined };

    table_of_scenarios[ 0 ] = { community: 'AAA', name: 'BBB', description: 'CCC', tags: undefined };

    // table_of_scenarios[ 1 ] = { community: 'DDD', name: 'EEE', description: 'FFF', tags: undefined };

    const table_of_containers = [];

    const table_of_stages = {};

    table_of_stages.start = 'Server was **Started** by __USER__.';

    table_of_stages.update = 'Server was **Updated** to __VERSION__ by __USER__.';

    table_of_stages.restart = 'Server was **Restarted** by __USER__.';

    table_of_stages.stop = 'Server was **Stopped** by __USER__.';

    table_of_stages.online = 'Players **Online** __ONLINE__.';

    table_of_stages.error = '```__ERROR__```';

    const table_of_commands = {};

    table_of_commands.server = { parameters: '', information: 'Displays the hardware information.', usage: '!info', permissions: '@Everyone' };

    table_of_commands.list = { parameters: '', information: 'Displays all running servers.', usage: '!list', permissions: '@Everyone' };

    table_of_commands.status = { parameters: '*<**pid**>*', information: 'Displays the version, game tick, map name and the number of players (online/offline).', usage: '!status <pid>', permissions: '@Everyone' };

    table_of_commands.online = { parameters: '*<**pid**>*', information: 'Displays the current number of online players.', usage: '!online <pid>', permissions: '@Everyone' };

    table_of_commands.start = { parameters: '*<**all**|**pid**>* *default:* **all**', information: 'Starts the server.', usage: '!start <all|pid>', permissions: '@Moderator' };

    table_of_commands.restart = { parameters: '*<**all**|**pid**>* *default:* **all**', information: 'Restarts the server.', usage: '!restart <all|pid>', permissions: '@Moderator' };

    table_of_commands.stop = { parameters: '*<**all**|**pid**>* *default:* **all**', information: 'Stops the server.', usage: '!stop <all|pid>', permissions: '@Moderator' };

    table_of_commands.kick = { parameters: '*<**name**> <**reason**>*', information: 'Kicks a player from the server.', usage: '!kick <name> <reason>', permissions: '@Moderator' };

    table_of_commands.ban = { parameters: '*<**name**> <**reason**>*', information: 'Bans a player from the server.', usage: '!ban <name> <reason>', permissions: '@Moderator' };

    table_of_commands.unban = { parameters: '*<**name**>*', information: 'Un-bans a player from the server.', usage: '!unban <name>', permissions: '@Moderator' };

    table_of_commands.promote = { parameters: '*<**name**>*', information: 'Promotes a in-game player to administrator.', usage: '!promote <name>', permissions: '@Administrator' };

    table_of_commands.demote = { parameters: '*<**name**>*', information: 'Demotes a in-game player.', usage: '!demote <name>', permissions: '@Administrator' };

    //-------------------------------------------------
    // CLASS SCRIPT EVENT
    //-------------------------------------------------

    class ScriptEvent
    {
        constructor()
        {
            this.table_of_events = {};
        }

        register( name, callback )
        {
            this.table_of_events[ name ] = callback;
        }

        trigger( name )
        {
            let argument = '';

            for ( let index = 1; index < arguments.length; index++ )
            {
                argument = argument + arguments[ index ];
            }

            console.log( 'trigger -> ' + name + ' -> ' + argument );

            if ( this.table_of_events[ name ] )
            {
                this.table_of_events[ name ]( arguments );
            }
        }
    }

    const script = { event: new ScriptEvent() };

    //-------------------------------------------------
    // CLASS FACTORIO SERVER
    //-------------------------------------------------

    function docker_run_container( key, value )
    {
        // const container = spawn( 'docker', [ 'run', '--rm', '--interactive', '--attach', 'stdin', '--attach', 'stdout', '--attach', 'stderr', '--env', 'RCON_PORT=2000' + key, '--publish', '0.0.0.0:2000' + key + ':2000' + key + '/tcp', '--env', 'PORT=3000' + key, '--publish', '0.0.0.0:3000' + key + ':3000' + key + '/udp', '--volume', '/opt/factorio:/factorio', '--entrypoint', '/scenario.sh', 'factoriotools/factorio', 'ComfyFactorio' ] );

        const container = spawn( 'docker', [ 'run', '--rm', '--interactive', '--attach', 'stdin', '--attach', 'stdout', '--attach', 'stderr', 'factoriotools/factorio' ] );

        script.event.trigger( 'script_event_on_container_start', 'process -> ' + process.pid + ' -> container -> ' + container.pid + ' -> scenario -> ' + value.community + ' ' + value.name );

        table_of_containers[ container.pid ] = { process: container, scenario: key, version: undefined, online: false, uptime: 0, activity: 0, number_of_connected_players: 0 };

        table_of_containers[ container.pid ].process.stdin.setEncoding( 'utf8' );

        table_of_containers[ container.pid ].process.stdout.setEncoding( 'utf8' );

        table_of_containers[ container.pid ].process.stderr.setEncoding( 'utf8' );

        table_of_containers[ container.pid ].process.stdout.on( 'data', ( data ) => { handle_on_container_data( container.pid, data ) } );

        table_of_containers[ container.pid ].process.stderr.on( 'data', ( data ) => { handle_on_container_error( container.pid, data ) } );

        table_of_containers[ container.pid ].process.on( 'error', ( error ) => { handle_on_container_error( container.pid, error ) } );

        table_of_containers[ container.pid ].process.on( 'close', ( close ) => { handle_on_container_close( container.pid, close ) } );
    }

    for ( let [ key, value ] of Object.entries( table_of_scenarios ) )
    {
        docker_run_container( key, value );
    }

    function handle_on_container_data( pid, data )
    {
        const content = data.toString().replace( /\n\s+/g, '\n' ).trim();

        console.log( pid + ' -> ' + content );

        const uptime = /^(\d+\.\d{3}).*/.exec( content );

        if ( uptime )
        {
            table_of_containers[ pid ].uptime = uptime[ 1 ];

            table_of_containers[ pid ].activity = Math.floor( Date.now() / 1000 );
        }

        const chat = /.*\[CHAT\]\s(.*):\s(.*)/.exec( content );

        if ( chat )
        {
            script.event.trigger( 'script_event_on_container_chat', [ pid, chat[ 1 ], chat[ 2 ] ] );

            // discord_on_chat( 'bananas', chat[ 1 ], chat[ 2 ] );

            return;
        }

        const join_or_leave = /.*\[PLAYER-(JOIN|LEAVE)\](.*)$/.exec( content );

        if ( join_or_leave )
        {
            if ( join_or_leave[ 1 ] == 'JOIN' )
            {
                table_of_containers[ pid ].number_of_connected_players += 1;
            }

            if ( join_or_leave[ 1 ] == 'LEAVE' )
            {
                table_of_containers[ pid ].number_of_connected_players -= 1;
            }

            return;
        }

        if ( table_of_containers[ pid ].version == undefined )
        {
            const version = /.*Factorio\s(.*)\s\((build.*)\).*/.exec( content );

            if ( version )
            {
                table_of_containers[ pid ].version = version[ 1 ];

                return;
            }
        }

        if ( table_of_containers[ pid ].online == false )
        {
            const online = /.*Matching server connection resumed.*/.test( content );

            if ( online )
            {
                const scenario = table_of_containers[ pid ].scenario;

                script.event.trigger( 'script_event_on_container_online', table_of_scenarios[ scenario ].community + ' ' + table_of_scenarios[ scenario ].name );

                table_of_containers[ pid ].online = true;

                // table_of_containers[ pid ].process.stdin.write( '/config set name "' + table_of_scenarios[ scenario ].community + ' ' + table_of_scenarios[ scenario ].name + '"' );

                // table_of_containers[ pid ].process.stdin.write( '/config set description "' + table_of_scenarios[ scenario ].description + '"' );

                return;
            }
        }

        const error = /.*(Error\s.*)/.exec( content );

        if ( error )
        {
            script.event.trigger( 'script_event_on_container_error', pid + ' -> ' + error[ 1 ] );

            // discord_embedded_message( 'bananas', 'Error', table_of_stages.error.replace( '__ERROR__', error[ 1 ] ), 0xff0000 );

            return;
        }
    }

    function script_event_on_container_chat( argv )
    {
        for ( let [ key, value ] of Object.entries( table_of_containers ) )
        {
            if ( argv[ 0 ] != key && table_of_containers[ key ].online )
            {
                const scenario = table_of_containers[ key ].scenario;

                table_of_containers[ key ].process.stdin.write( "/silent-command game.print( '[" + table_of_scenarios[ scenario ].name + " #" + key + "] " + argv[ 1 ] + ": " + argv[ 2 ] + "', { r = 255, g = 255, b = 255, a = 1 } )\n" );
            }
        }
    }

    script.event.register( 'script_event_on_container_chat', script_event_on_container_chat );

    function script_event_on_container_status( pid )
    {
        if ( typeof table_of_containers[ pid ] == 'undefined' )
        {
            return;
        }

        if ( table_of_containers[ pid ].online == true )
        {
            // discord_embedded_message( 'bananas', 'Error', 'Server is currently running', 0x00ff00 );
        }
        else
        {
            // discord_embedded_message( 'bananas', 'Error', 'Server is currently not running', 0xff0000 );
        }
    }

    script.event.register( 'script_event_on_container_status', script_event_on_container_status );

    function script_event_on_container_start( event )
    {

    }

    script.event.register( 'script_event_on_container_start', script_event_on_container_start );

    function script_event_on_container_restart()
    {

    }

    script.event.register( 'script_event_on_container_restart', script_event_on_container_restart );

    function script_event_on_container_online()
    {

    }

    script.event.register( 'script_event_on_container_online', script_event_on_container_online );

    function script_event_on_container_stop( pid )
    {
        if ( table_of_containers[ pid ].process == false )
        {
            console.log( 'Container is currently not running.' );

            // discord_embedded_message( 'bananas', 'Error', 'Server is currently not running', 0xff0000 );
        }
        else
        {
            table_of_containers[ pid ].process.kill( 'SIGTERM' );
        }
    }

    script.event.register( 'script_event_on_container_stop', script_event_on_container_stop );

    function handle_on_container_error( pid, error )
    {
        script.event.trigger( 'script_event_on_container_error', 'pid -> ' + pid + ' -> ' + error.toString().trim() );
    }

    function handle_on_container_close( pid, close )
    {
        script.event.trigger( 'script_event_on_container_close', 'pid -> ' + pid + ' -> uptime -> ' + table_of_containers[ pid ].uptime );

        delete table_of_containers[ pid ]
    }

    function handle_on_console_sigint()
    {
        for ( let [ key, value ] of Object.entries( table_of_containers ) )
        {
            table_of_containers[ key ].process.kill( 'SIGTERM' );
        }

        if ( typeof interval_reference != 'undefined' )
        {
            clearInterval( interval_reference );
        }
    }

    process.on( 'SIGINT', handle_on_console_sigint );

    const maximum_idle_time_of_a_container = 259200;

    function handle_on_container_status()
    {
        for ( let [ key, value ] of Object.entries( table_of_containers ) )
        {
            if ( Math.floor( Date.now() / 1000 ) - table_of_containers[ key ].activity > maximum_idle_time_of_a_container )
            {
                script.event.trigger( 'script_event_on_container_stop', key );
            }
        }
    }

    const interval_reference = setInterval( handle_on_container_status, 1000 );

    //-------------------------------------------------
    // EVENT DISCORD CLIENT ON MESSAGE
    //-------------------------------------------------

    function event_on_message( message )
    {
        if ( message.author.bot || message.type != 'DEFAULT' || message.channel.name !== 'bananas' )
        {
            return;
        }

        if ( message.content.startsWith( '!' ) )
        {
            if ( check_permissions( 'Everyone', message ) == false )
            {
                return;
            }

            const parameter = message.content.split( /\s/g )[ 1 ];

            if ( message.content.startsWith( '!help' ) )
            {
                // print_help( 'bananas' );
            }
            else if ( message.content.startsWith( '!info' ) )
            {
                // discord_embedded_message( 'bananas', 'Hardware Information', '3 Cores @ 3,90 GHz -- 8 GByte RAM -- **OS** Linux' );
            }
            else if ( message.content.startsWith( '!status' ) )
            {
                // discord_embedded_message( 'bananas', 'Status', table_of_stages.online.replace( '__ONLINE__', number_of_connected_players[ 1 ] ), 0x0000ff );

                // script.event.trigger( 'script_event_on_container_status', pid );

                // if ( factorio.server.online )
                // {
                //     discord_embedded_message( 'bananas', 'Error', 'Server is currently running.', 0x00ff00 );
                // }
                // else
                // {
                //     discord_embedded_message( 'bananas', 'Error', 'Server is currently not running.', 0xff0000 );
                // }
            }
            else if ( message.content.startsWith( '!start' ) )
            {
                // if ( factorio.server.online )
                // {
                //     discord_embedded_message( 'bananas', 'Error', 'Server is currently running.', 0xff0000 );
                // }
                // else
                // {
                //     script.event.register( 'script_event_on_container_start', () => { discord_embedded_message( 'bananas', 'Status', table_of_stages.start.replace( '__USER__', message.author.username ), 0x00ff00 ) } );

                //     await factorio.server.start( 'new' );
                // }
            }
            else if ( message.content.startsWith( '!stop' ) )
            {
                // if ( factorio.server.online )
                // {
                //     script.event.register( 'event_on_process_stopped', () => { discord_embedded_message( 'bananas', 'Status', table_of_stages.stop.replace( '__USER__', message.author.username ), 0xff0000 ) } );

                //     await factorio.server.stop();
                // }
                // else
                // {
                //     discord_embedded_message( 'bananas', 'Error', 'Server is currently not running.', 0xff0000 );
                // }
            }
            else if ( message.content.startsWith( '!restart' ) )
            {

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
            // if ( factorio.server.online )
            // {
            //     const content = escape_string( message.cleanContent );

            //     factorio.server.on_console_chat( message.author.username, content );
            // }
        }
    }

    discord.client.on( 'message', event_on_message );

    //-------------------------------------------------
    // CODE
    //-------------------------------------------------

    const escape_string = ( message ) =>
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

    const discord_on_chat = ( name_of_channel, user, message ) =>
    {
        const handle = discord.client.channels.find( ( channel ) => channel.name === name_of_channel );

        if ( handle != false )
        {
            handle.send( '**' + user + '** *' + message + '*' );
        }
    }

    const join_or_leave_message = ( name_of_channel, user, join_or_leave ) =>
    {
        const handle = discord.client.channels.find( ( channel ) => channel.name === name_of_channel );

        if ( handle != false )
        {
            handle.send( '**⟶ ' + user + ' ' + join_or_leave + ' the server ⟵**' );
        }
    }

    const print_help = ( name_of_channel ) =>
    {
        const handle = discord.client.channels.find( ( channel ) => channel.name === name_of_channel );

        if ( handle != false )
        {
            let title = 'Commands';

            let color = 0xaa55ff;

            let message = '';

            for ( let [ key, value ] of Object.entries( table_of_commands ) )
            {
                message += '**!' + key + '** ' + value.parameters + '\n\t↳ ' + value.information + '\n\t↳ Usage: `' + value.usage + '`\n↳Permissions: **' + value.permissions + '**\n\n';
            }

            handle.send( new RichEmbed().setTimestamp().setTitle( '**' + title + '**' ).setColor( color ).setDescription( message ) );
        }
    }

    const discord_embedded_message = ( name_of_channel, title, message, color = 0xff0000 ) =>
    {
        const handle = discord.client.channels.find( ( channel ) => channel.name === name_of_channel );

        if ( handle != false )
        {
            handle.send( new RichEmbed().setTimestamp().setTitle( '**' + title + '**' ).setColor( color ).setDescription( message ) );
        }
    }