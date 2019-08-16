
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

    table_of_scenarios[ 0 ] = { community: 'AAA', scenario: 'BBB', description: 'CCC', tags: undefined };

    // table_of_scenarios[ 1 ] = { community: 'DDD', scenario: 'EEE', description: 'FFF', tags: undefined };

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

        trigger( name, value )
        {
            console.log( 'trigger ->', name + ( ( value == undefined ) ? '' : ' -> ' + value.toString() ) );

            if ( this.table_of_events[ name ] )
            {
                this.table_of_events[ name ]( value );
            }
        }
    }

    const script = { event: new ScriptEvent() };

    //-------------------------------------------------
    // CLASS FACTORIO SERVER
    //-------------------------------------------------

    for ( let [ key, value ] of Object.entries( table_of_scenarios ) )
    {
        const container = spawn( 'docker', [ 'run', '--rm', '--interactive', '--attach', 'stdout', '--attach', 'stderr', '--env', 'INSTANCE_NAME=' + value.community + ' ' + value.scenario, '--env', 'INSTANCE_DESC=' + value.description, '--env', 'RCON_PORT=2000' + key, '--publish', '0.0.0.0:2000' + key + ':2000' + key + '/tcp', '--env', 'PORT=3000' + key, '--publish', '0.0.0.0:3000' + key + ':3000' + key + '/udp', '--volume', '/opt/factorio:/factorio', '--entrypoint', '/scenario.sh', 'factoriotools/factorio', 'ComfyFactorio' ] );

        script.event.trigger( 'event_on_container_start', 'process -> ' + process.pid + ' -> container -> ' + container.pid + ' -> scenario -> ' + value.community + ' ' + value.scenario );

        table_of_containers[ container.pid ] = { process: container, instance: key, online: false, version: undefined, uptime: 0, number_of_connected_players: 0 };

        table_of_containers[ container.pid ].process.stdout.setEncoding( 'utf8' );

        table_of_containers[ container.pid ].process.stderr.setEncoding( 'utf8' );

        table_of_containers[ container.pid ].process.stdout.on( 'data', ( data ) => { event_on_container_data( container.pid, data ) } );

        table_of_containers[ container.pid ].process.stderr.on( 'data', ( data ) => { event_on_container_error( container.pid, data ) } );

        table_of_containers[ container.pid ].process.on( 'error', ( error ) => { event_on_container_error( container.pid, error ) } );

        table_of_containers[ container.pid ].process.on( 'close', ( close ) => { event_on_container_close( container.pid, close ) } );
    }

    function event_on_container_data( pid, data )
    {
        const content = data.toString().replace( /\n\s+/g, '\n' ).trim();

        console.log( pid + ' -> ' + content );

        const uptime = /^(\d+)\.\d{3}.*/.exec( content );

        if ( uptime )
        {
            table_of_containers[ pid ].uptime = uptime[ 1 ];
        }

        const chat = /.*\[CHAT\]\s(.*):\s(.*)/.exec( content );

        if ( chat )
        {
            script.event.trigger( 'event_on_container_chat', [ pid, chat[ 1 ], chat[ 2 ] ] );

            // discord_on_chat( 'bananas', chat[ 1 ], chat[ 2 ] );

            return;
        }

        const join_or_leave = /.*\[(JOIN|LEAVE)\]\s(.*)/.exec( content );

        if ( join_or_leave )
        {
            script.event.trigger( 'event_on_container_join_or_leave', [ pid, join_or_leave[ 2 ] ] );

            return;
        }

        const number_of_connected_players = /.*Script\slog.*\[ONLINE\]\s(\d+)/.exec( content );

        if ( number_of_connected_players )
        {
            table_of_containers[ pid ].number_of_connected_players = number_of_connected_players[ 1 ];

            // discord_embedded_message( 'bananas', 'Status', table_of_stages.online.replace( '__ONLINE__', number_of_connected_players[ 1 ] ), 0x0000ff );

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
                script.event.trigger( 'event_on_container_online', pid );

                table_of_containers[ pid ].online = true;

                return;
            }
        }

        const error = /.*(Error\s.*)/.exec( content );

        if ( error )
        {
            script.event.trigger( 'event_on_container_error', pid + ' -> ' + error[ 1 ] );

            // discord_embedded_message( 'bananas', 'Error', table_of_stages.error.replace( '__ERROR__', error[ 1 ] ), 0xff0000 );

            return;
        }
    }

    function event_on_container_chat( argv )
    {
        for ( let [ key, value ] of Object.entries( table_of_containers ) )
        {
            // if ( argv[ 0 ] != key && table_of_containers[ key ].online )

            if ( table_of_containers[ key ].online )
            {
                const instance = table_of_containers[ key ].instance;

                table_of_containers[ key ].process.stdin.write( "/silent-command game.print( '[" + table_of_scenarios[ instance ].scenario + "] " + argv[ 1 ] + ": " + argv[ 2 ] + "', { r = 255, g = 255, b = 255, a = 1 } )\n" );
            }
        }
    }

    script.event.register( 'event_on_container_chat', event_on_container_chat );

    function event_on_container_status( pid )
    {
        if ( typeof table_of_containers[ pid ] != 'undefined' )
        {
            if ( table_of_containers[ pid ].online == true )
            {
                table_of_containers[ pid ].process.stdin.write( "/silent-command log( '[ONLINE] ' .. #game.connected_players )\n" );
            }
            else
            {
                // discord_embedded_message( 'bananas', 'Error', 'Server is currently not running', 0xff0000 );
            }
        }
    }

    script.event.register( 'event_on_container_status', event_on_container_status );

    // function event_on_container_start( event )
    // {

    // }

    // script.event.register( 'event_on_container_start', event_on_container_start );

    // function event_on_container_restart()
    // {

    // }

    // script.event.register( 'event_on_container_restart', event_on_container_restart );

    // function event_on_container_online()
    // {

    // }

    // script.event.register( 'event_on_container_online', event_on_container_online );

    // function event_on_container_stop( event )
    // {
    //     if ( this.child.process == false )
    //     {
    //         discord_embedded_message( 'bananas', 'Error', 'Server is currently not running', 0xff0000 );
    //     }
    //     else
    //     {
    //         this.child.process.kill( 'SIGTERM' );

    //         this.child.process = undefined;
    //     }
    // }

    // script.event.register( 'event_on_container_stop', event_on_container_stop );

    function event_on_container_error( pid, error )
    {
        script.event.trigger( 'event_on_container_error', 'pid -> ' + pid + ' -> ' + error.toString().trim() );
    }

    function event_on_container_close( pid, close )
    {
        script.event.trigger( 'event_on_container_close', 'pid -> ' + pid + ' -> uptime -> ' + table_of_containers[ pid ].uptime );

        table_of_containers[ pid ] = undefined;
    }

    function event_on_console_sigint()
    {
        for ( let [ key, value ] of Object.entries( table_of_containers ) )
        {
            table_of_containers[ key ].process.kill( 'SIGTERM' );
        }
    }

    process.on( 'SIGINT', event_on_console_sigint );

    //-------------------------------------------------
    // CLASS FACTORIO SERVER
    //-------------------------------------------------

    // const sleep = require( 'sleep' );

    // while ( true )
    // {
    //     if ( factorio.server.online )
    //     {
    //         console.log( 'Server is running.' );
    //     }
    //     else
    //     {
    //         console.log( 'Server is not running.' );
    //     }

    //     sleep.sleep( 1 );
    // }

    // if ( process.argv[ 2 ] === 'child' )
    // {
    //     const child = spawn( 'ls' );

    //     child.stdout.pipe( process.stdout );
    // }
    // else
    // {
    //     const child = spawn( process.execPath, [ __filename, 'child' ] );
    // }

    //-------------------------------------------------
    // EVENT DISCORD CLIENT ON MESSAGE
    //-------------------------------------------------

    discord.client.on( 'message', async( message ) =>
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
                // script.event.trigger( 'event_on_container_status', pid );

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
                //     script.event.register( 'event_on_container_start', () => { discord_embedded_message( 'bananas', 'Status', table_of_stages.start.replace( '__USER__', message.author.username ), 0x00ff00 ) } );

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

    } );

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

    const discord_embedded_message = ( channel_name, title, message, color = 0xff0000 ) =>
    {
        const bananas = discord.client.channels.find( ( channel ) => channel.name === channel_name );

        if ( bananas == false )
        {
            return;
        }

        const embed = new RichEmbed().setTimestamp().setTitle( '**' + title + '**' ).setColor( color ).setDescription( message );

        bananas.send( embed );
    }

    const join_or_leave_message = ( channel_name, user, join_or_leave ) =>
    {
        const bananas = discord.client.channels.find( ( channel ) => channel.name === channel_name );

        if ( bananas == false )
        {
            return;
        }

        bananas.send( '**⟶ ' + user + ' ' + join_or_leave + ' the server ⟵**' );
    }

    const discord_on_chat = ( channel_name, user, message ) =>
    {
        const bananas = discord.client.channels.find( ( channel ) => channel.name === channel_name );

        if ( bananas == false )
        {
            return;
        }

        bananas.send( '**' + user + '** *' + message + '*' );
    }

    const print_help = ( channel_name ) =>
    {
        const bananas = discord.client.channels.find( ( channel ) => channel.name === channel_name );

        if ( bananas == false )
        {
            return;
        }

        let string = '';

        for ( let [ name, value ] of Object.entries( table_of_commands ) )
        {
            string += '**!' + name + '** ' + value.parameters + '\n\t↳ ' + value.information + '\n\t↳ Usage: `' + value.usage + '`\n↳Permissions: **' + value.permissions + '**\n\n';
        }

        discord_embedded_message( channel_name, 'Commands', string, 0xaa55ff );
    }
