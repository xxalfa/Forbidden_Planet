
    //-------------------------------------------------
    // HEAD
    //-------------------------------------------------

    "use strict";

    const os = require( 'os' );

    const { spawn, exec } = require( 'child_process' );

    const auth = require( './auth' );

    const { Client, RichEmbed } = require( 'discord.js' );

    const discord = { client: new Client() };

    // discord.client.login( auth.token );

    let latest_factorio_version = undefined;

    //-------------------------------------------------
    // TABLES
    //-------------------------------------------------

    const table_of_ranks = [ 'Administrator', 'Moderator', 'Trusted', 'Everyone' ];

    const table_of_images = [ 'factoriotools/factorio' ];

    const table_of_scenarios = [];

    // table_of_scenarios[ 0 ] = { community: '[color=blue]~COMFY~[/color]', name: 'Tank Conquest', description: 'Drive and shoot.', tags: undefined, version: undefined, number_of_running_processes: 0, further_start_desired: false };

    // table_of_scenarios[ 1 ] = { community: '[color=blue]~COMFY~[/color]', name: 'Biter Battles', description: 'Fight.', tags: undefined, version: undefined, number_of_running_processes: 0, further_start_desired: false };

    table_of_scenarios[ 0 ] = { community: 'AAA', name: 'BBB', description: 'CCC', tags: undefined, version: undefined, number_of_running_processes: 0, further_start_desired: false };

    table_of_scenarios[ 1 ] = { community: 'DDD', name: 'EEE', description: 'FFF', tags: undefined, version: undefined, number_of_running_processes: 0, further_start_desired: false };

    table_of_scenarios[ 2 ] = { community: 'GGG', name: 'HHH', description: 'III', tags: undefined, version: undefined, number_of_running_processes: 0, further_start_desired: false };

    table_of_scenarios[ 3 ] = { community: 'ZZZ', name: 'XXX', description: 'YYY', tags: undefined, version: undefined, number_of_running_processes: 0, further_start_desired: false };

    const table_of_containers = [];

    const table_of_stages = {};

    table_of_stages.error = '```__ERROR__```';

    const table_of_commands = {};

    table_of_commands.server = { parameters: '', information: 'Displays the hardware information.', usage: '!info', permissions: '@Everyone' };

    table_of_commands.list = { parameters: '', information: 'Displays all running servers.', usage: '!list', permissions: '@Everyone' };

    table_of_commands.status = { parameters: '*<**pid**>*', information: 'Displays the version, game tick, map name and the number of players (online/offline).', usage: '!status <pid>', permissions: '@Everyone' };

    table_of_commands.online = { parameters: '*<**pid**>*', information: 'Displays the current number of online players.', usage: '!online <pid>', permissions: '@Everyone' };

    table_of_commands.start = { parameters: '*<**all**|**pid**>* *default:* **all**', information: 'Starts the server.', usage: '!start <all|pid>', permissions: '@Moderator' };

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

        trigger( name, argument )
        {
            console.log( 'trigger -> ' + name + ' -> ' + argument );

            if ( typeof this.table_of_events[ name ] != 'undefined' )
            {
                this.table_of_events[ name ]( argument );
            }
        }
    }

    const script = { event: new ScriptEvent() };

    function script_event_on_container_start( pid )
    {
        if ( typeof table_of_containers[ pid ] == 'undefined' )
        {
            // discord_embedded_message( 'bananas', 'Error', 'Server not found.', 0xff0000 );
        }
        else
        {
            // const scenario = table_of_containers[ pid ].scenario;

            // discord_embedded_message( 'bananas', 'Error', table_of_scenarios[ scenario ].community + ' (' + pid + ') ' + table_of_scenarios[ scenario ].name + ' started.', 0x00ff00 );
        }
    }

    script.event.register( 'script_event_on_container_start', script_event_on_container_start );

    function script_event_on_container_chat( argv )
    {
        for ( let [ key, value ] of Object.entries( table_of_containers ) )
        {
            if ( argv[ 0 ] != key && value.is_public == true )
            {
                const scenario = value.scenario;

                value.process.stdin.write( "/silent-command game.print( '[" + table_of_scenarios[ scenario ].name + " #" + key + "] " + argv[ 1 ] + ": " + argv[ 2 ] + "', { r = 255, g = 255, b = 255, a = 1 } )\n" );
            }
        }
    }

    script.event.register( 'script_event_on_container_chat', script_event_on_container_chat );

    function script_event_on_container_status( pid )
    {
        if ( typeof table_of_containers[ pid ] == 'undefined' )
        {
            // discord_embedded_message( 'bananas', 'Error', 'Server not found.', 0x00ff00 );
        }
        else if ( table_of_containers[ pid ].is_public == true )
        {
            // const scenario = table_of_containers[ pid ].scenario;

            // discord_embedded_message( 'bananas', 'Status', table_of_scenarios[ scenario ].community + ' (' + pid + ') ' + table_of_scenarios[ scenario ].name + ' is online.', 0x00ff00 );
        }
    }

    script.event.register( 'script_event_on_container_status', script_event_on_container_status );

    function script_event_on_container_stop( pid )
    {
        if ( typeof table_of_containers[ pid ] == 'undefined' )
        {
            // discord_embedded_message( 'bananas', 'Error', 'Server not found.', 0xff0000 );
        }
        else
        {
            // const scenario = table_of_containers[ pid ].scenario;

            // discord_embedded_message( 'bananas', 'Error', table_of_scenarios[ scenario ].community + ' ' + table_of_scenarios[ scenario ].name + ' stopped.', 0x00ff00 );

            table_of_containers[ pid ].process.kill( 'SIGTERM' );
        }
    }

    script.event.register( 'script_event_on_container_stop', script_event_on_container_stop );

    //-------------------------------------------------
    // CLASS FACTORIO SERVER
    //-------------------------------------------------

    function docker_run_container( key, value )
    {
        // const container = spawn( 'docker', [ 'run', '--rm', '--interactive', '--attach', 'stdin', '--attach', 'stdout', '--attach', 'stderr', '--env', 'RCON_PORT=2000' + key, '--publish', '0.0.0.0:2000' + key + ':2000' + key + '/tcp', '--env', 'PORT=3000' + key, '--publish', '0.0.0.0:3000' + key + ':3000' + key + '/udp', '--volume', '/opt/factorio:/factorio', '--entrypoint', '/scenario.sh', 'factoriotools/factorio', 'ComfyFactorio' ] );

        const container = spawn( 'docker', [ 'run', '--rm', '--interactive', '--attach', 'stdin', '--attach', 'stdout', '--attach', 'stderr', 'factoriotools/factorio' ] );

        script.event.trigger( 'script_event_on_container_start', 'process -> ' + process.pid + ' -> container -> ' + container.pid + ' -> scenario -> ' + value.community + ' ' + value.name );

        table_of_containers[ container.pid ] = { process: container, scenario: key, version: '0.0.0', is_public: false, uptime: 0, activity: Math.floor( Date.now() / 1000 ), number_of_connected_players: 0 };

        table_of_containers[ container.pid ].process.stdin.setEncoding( 'utf8' );

        table_of_containers[ container.pid ].process.stdout.setEncoding( 'utf8' );

        table_of_containers[ container.pid ].process.stderr.setEncoding( 'utf8' );

        table_of_containers[ container.pid ].process.stdout.on( 'data', ( data ) => { handle_on_container_data( container.pid, data ) } );

        table_of_containers[ container.pid ].process.stderr.on( 'data', ( data ) => { handle_on_container_error( container.pid, data ) } );

        table_of_containers[ container.pid ].process.on( 'error', ( error ) => { handle_on_container_error( container.pid, error ) } );

        table_of_containers[ container.pid ].process.on( 'close', ( close ) => { handle_on_container_close( container.pid, close ) } );
    }

    function handle_on_container_data( pid, data )
    {
        const content = data.toString().replace( /\n\s+/g, '\n' ).trim();

        // console.log( pid + ' -> ' + content );

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

            // discord_embedded_message( 'bananas', 'Message', '**' + chat[ 1 ] + '** *' + chat[ 2 ] + '*', 0x00ff00 );

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
                latest_factorio_version = version[ 1 ];

                table_of_containers[ pid ].version = version[ 1 ];

                const scenario = table_of_containers[ pid ].scenario;

                table_of_scenarios[ scenario ].version = version[ 1 ];

                return;
            }
        }

        if ( table_of_containers[ pid ].is_public == false )
        {
            const online = /.*Matching server connection resumed.*/.test( content );

            if ( online )
            {
                table_of_containers[ pid ].is_public = true;

                script.event.trigger( 'script_event_on_container_status', pid );

                // const scenario = table_of_containers[ pid ].scenario;

                // table_of_containers[ pid ].process.stdin.write( '/config set name "' + table_of_scenarios[ scenario ].community + ' ' + table_of_scenarios[ scenario ].name + ' #' + pid + '"' );

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

    function handle_on_container_error( pid, error )
    {
        // script.event.trigger( 'script_event_on_container_error', 'pid -> ' + pid + ' -> ' + error.toString().trim() );
    }

    function handle_on_container_close( pid, close )
    {
        script.event.trigger( 'script_event_on_container_close', 'pid -> ' + pid + ' -> uptime -> ' + table_of_containers[ pid ].uptime );

        const scenario = table_of_containers[ pid ].scenario;

        table_of_scenarios[ scenario ].number_of_running_processes -= 1;

        delete table_of_containers[ pid ]
    }

    function handle_on_console_sigint()
    {
        for ( let [ key, value ] of Object.entries( table_of_containers ) )
        {
            value.process.kill( 'SIGTERM' );
        }

        if ( typeof reference_for_container_status != 'undefined' )
        {
            clearInterval( reference_for_container_status );
        }
    }

    process.on( 'SIGINT', handle_on_console_sigint );

    const maximum_idle_time_of_a_container = 259200;

    function handle_on_container_status()
    {
        if ( is_still_being_processed == true )
        {
            console.log( 'skip container status' );

            return;
        }

        is_still_being_processed = true;

        const current_cpu_usage = get_cpu_usage();

        const memory_size_free = os.freemem()

        const memory_size_total = os.totalmem();

        const cpu_percent = Math.floor( ( 1 - ( ( current_cpu_usage.idle - last_cpu_usage.idle ) / ( current_cpu_usage.total - last_cpu_usage.total ) ) ) * 100 );

        const memory_percent = Math.floor( ( ( memory_size_total - memory_size_free ) / memory_size_total ) * 100 );

        if ( cpu_percent <= 50 && memory_percent <= 95 )
        {
            // Wenn docker pull eine neue version hat, dann setzte die version auf undefined

            // latest_factorio_version = undefined;

            // table_of_scenarios[ all ].version = undefined;

            for ( let [ key, value ] of Object.entries( table_of_scenarios ) )
            {
                if ( value.version == undefined || value.number_of_running_processes == 0 || value.further_start_desired == true )
                {
                    value.version = '0.0.0';

                    value.number_of_running_processes += 1;

                    value.further_start_desired = false;

                    docker_run_container( key, value );

                    break;
                }
            }

            for ( let [ key, value ] of Object.entries( table_of_containers ) )
            {
                if ( Math.floor( Date.now() / 1000 ) - value.activity > maximum_idle_time_of_a_container && value.number_of_connected_players < 1 )
                {
                    script.event.trigger( 'script_event_on_container_stop', key );
                }
            }
        }

        last_cpu_usage = current_cpu_usage;

        is_still_being_processed = false;
    }

    let is_still_being_processed = false;

    let last_cpu_usage = get_cpu_usage();

    const reference_for_container_status = setInterval( handle_on_container_status, 1000 );

    function get_cpu_usage()
    {
        const cpus = os.cpus();

        const usage = { 'idle': 0, 'total': 0 };

        for ( let cpu in cpus )
        {
            usage.idle += cpus[ cpu ].times.idle;

            usage.total += cpus[ cpu ].times.user + cpus[ cpu ].times.nice + cpus[ cpu ].times.sys + cpus[ cpu ].times.idle + cpus[ cpu ].times.irq;
        }

        return usage;
    }

    //-------------------------------------------------
    // EVENT DISCORD CLIENT ON MESSAGE
    //-------------------------------------------------

    function handle_on_discord_message( message )
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
                // let message = '';

                // for ( let [ key, value ] of Object.entries( table_of_commands ) )
                // {
                //     message += '**!' + key + '** ' + value.parameters + '\n\t↳ ' + value.information + '\n\t↳ Usage: `' + value.usage + '`\n↳Permissions: **' + value.permissions + '**\n\n';
                // }

                // discord_embedded_message( 'bananas', 'Commands', message, 0xaa55ff );

            }
            else if ( message.content.startsWith( '!info' ) )
            {
                // discord_embedded_message( 'bananas', 'Hardware Information', process.platform() );
            }
            else if ( message.content.startsWith( '!start' ) )
            {
                // const pid = 0;

                // script.event.trigger( 'script_event_on_container_start', pid, message.author.username );
            }
            else if ( message.content.startsWith( '!status' ) )
            {
                // const pid = 0;

                // script.event.trigger( 'script_event_on_container_status', pid );
            }
            else if ( message.content.startsWith( '!stop' ) )
            {
                // const pid = 0;

                // script.event.trigger( 'script_event_on_container_stop', pid, message.author.username );
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
            // const content = escape_string( message.cleanContent );

            // script.event.trigger( 'script_event_on_container_chat', [ 0, message.author.username, '[Discord] ' + content ] );
        }
    }

    discord.client.on( 'message', handle_on_discord_message );

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

        // const userRank = table_of_ranks.indexOf( userRankName );

        // const requiredRank = table_of_ranks.indexOf( permission );

        // message.reply( `User Rank: ${userRank}, required: ${requiredRank}` );

        return true;
    }

    const discord_embedded_message = ( name_of_channel, title, message, color = 0xff0000 ) =>
    {
        const handle = discord.client.channels.find( ( channel ) => channel.name === name_of_channel );

        if ( handle != false )
        {
            handle.send( new RichEmbed().setTimestamp().setTitle( '**' + title + '**' ).setColor( color ).setDescription( message ) );
        }
    }

    function human_readable_file_size( bytes, precision = 2 )
    {
        if ( bytes === 0 ) return '0 Bytes';

        const dm = precision < 0 ? 0 : precision;

        const label = [ 'Bytes', 'KByte', 'MByte', 'GByte', 'TByte', 'PByte', 'EByte', 'ZByte', 'YByte' ];

        const index = Math.floor( Math.log( bytes ) / Math.log( 1024 ) );

        return parseFloat( ( bytes / Math.pow( 1024, index ) ).toFixed( dm ) ) + ' ' + label[ index ];
    }
