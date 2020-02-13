
    //-------------------------------------------------
    // HEAD
    //-------------------------------------------------

    'use strict';

    // const pdo = require( 'pdo' );

    // const data_source_name = 'sqlite:' + __dirname + __filename.substring( __dirname.length, __filename.lastIndexOf( '.' ) ) + '.sqlite';

    const http = require( 'http' );

    const os = require( 'os' );

    const fs = require( 'fs' );

    const { spawn, exec } = require( 'child_process' );

    const auth = require( './auth' );

    const { Client, RichEmbed } = require( 'discord.js' );

    const discord = { client: new Client() };

    // discord.client.login( auth.token );

    const upload_speed = { minimum: 100, maximum: 600, current: 600 };

    //-------------------------------------------------
    // IMAGES
    //-------------------------------------------------

    const table_of_images = [];

    exec( 'docker images --all --format "{{.Repository}}:{{.Tag}}"', handle_on_docker_images )

    function handle_on_docker_images( error, stdout, stderr )
    {
        if ( error || stderr )
        {
            throw error || stderr;
        }

        const array_of_items = stdout.match( /factoriotools\/factorio:.*/gi );

        const length_of_items = array_of_items.length;

        for ( let item_index = 0; item_index < length_of_items; item_index++ )
        {
            table_of_images[ item_index ] = { name: array_of_items[ item_index ], number_of_containers_running: 0, further_start_desired: false };

            // break; // If only one image should be loaded.
        }
    }

    //-------------------------------------------------
    // SCENARIOS
    //-------------------------------------------------

    const table_of_scenarios = [];

    const scenario_path = '/opt/factorio/scenarios';

    fs.readdir( scenario_path, handle_on_read_dir );

    function handle_on_read_dir( error, array_of_items )
    {
        if ( error )
        {
            throw error;
        }

        const length_of_items = array_of_items.length;

        for ( let item_index = 0; item_index < length_of_items; item_index++ )
        {
            const item_name = array_of_items[ item_index ];

            const item_path = scenario_path + '/' + item_name;

            if ( fs.lstatSync( item_path ).isDirectory() )
            {
                // if exsist description.txt

                table_of_scenarios[ item_index ] = { label: '[color=blue]~COMFY~[/color]', name: item_name, description: '', tags: table_of_tags };
            }
        }
    }

    //-------------------------------------------------
    // TABLES
    //-------------------------------------------------

    // chattr +i /opt/factorio/saves/Tank Conquest.zip

    // chattr +i /opt/factorio/saves/Tank Conquest.tmp.zip

    // chattr -i /opt/factorio/saves/Tank Conquest.zip

    // chattr -i /opt/factorio/saves/Tank Conquest.tmp.zip

    // for ( let [ scenario_key, scenario_value ] of Object.entries( table_of_scenarios ) )
    // {
    //     const file_path = '/opt/factorio/saves/' + scenario_value.name + '.zip';

    //     console.log( file_path );

    //     fs.access( file_path, fs.constants.F_OK, handle_on_file_exists );
    // }

    // const file_path = '/opt/factorio/saves/Tank Conquest.zip';

    // console.log( file_path );

    // fs.access( file_path, fs.constants.F_OK, handle_on_file_exists );

    // function handle_on_file_exists( error )
    // {
    //     if ( error )
    //     {
    //         console.log( error );
    //     }
    //     else
    //     {

    //     }
    // }

    //-------------------------------------------------
    // TABLES
    //-------------------------------------------------

    let service_port = { tcp: 20000, udp: 30000 };

    const table_of_tags = 'Hosted\xA0by\xA0XaLpHa1989 Linux\xA0Ubuntu\xA0Headless 24h\xA0DC\xA0at\xA004:28\xA0(CET/MEZ)';

    const table_of_ranks = [ 'Everyone', 'Trusted', 'Moderator', 'Administrator' ];

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
            this.table_of_events = [];
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
            // const scenario_identity = table_of_containers[ pid ].scenario_identity;

            // discord_embedded_message( 'bananas', 'Error', table_of_scenarios[ scenario_identity ].label + ' (' + pid + ') ' + table_of_scenarios[ scenario_identity ].name + ' started.', 0x00ff00 );
        }
    }

    script.event.register( 'script_event_on_container_start', script_event_on_container_start );

    function script_event_on_container_chat( argv )
    {
        argv[ 3 ] = argv[ 3 ].replace( /\W/g, '\x20' );

        for ( let [ container_key, container_value ] of Object.entries( table_of_containers ) )
        {
            if ( argv[ 0 ] != container_key && container_value.is_public == true )
            {
                container_value.process.stdin.write( "/silent-command game.print( '" + argv[ 1 ] + " (" + argv[ 2 ] + "): " + argv[ 3 ] + "', { r = 150, g = 100, b = 255, a = 255 } )\n" );
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
            // const scenario_identity = table_of_containers[ pid ].scenario_identity;

            // discord_embedded_message( 'bananas', 'Status', table_of_scenarios[ scenario_identity ].label + ' (' + pid + ') ' + table_of_scenarios[ scenario_identity ].name + ' is online.', 0x00ff00 );
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
            // const scenario_identity = table_of_containers[ pid ].scenario_identity;

            // discord_embedded_message( 'bananas', 'Error', table_of_scenarios[ scenario_identity ].label + ' ' + table_of_scenarios[ scenario_identity ].name + ' stopped.', 0x00ff00 );

            table_of_containers[ pid ].process.kill( 'SIGTERM' );
        }
    }

    script.event.register( 'script_event_on_container_stop', script_event_on_container_stop );

    //-------------------------------------------------
    // CLASS FACTORIO SERVER
    //-------------------------------------------------

    function docker_run_container( image_identity, image_name, scenario_identity, scenario_name )
    {
        const last_game_timestamp = Math.floor( Date.now() / 1000 );

        const container = spawn( 'docker', [ 'run', '--rm', '--interactive', '--attach', 'stdin', '--attach', 'stdout', '--attach', 'stderr', '--env', 'RCON_PORT=' + service_port.tcp, '--publish', '0.0.0.0:' + service_port.tcp + ':' + service_port.tcp + '/tcp', '--env', 'PORT=' + service_port.udp, '--publish', '0.0.0.0:' + service_port.udp + ':' + service_port.udp + '/udp', '--volume', '/opt/factorio:/factorio', '--entrypoint', '/scenario.sh', image_name, scenario_name ] );

        script.event.trigger( 'script_event_on_container_start', 'process -> ' + process.pid + ' -> container -> ' + container.pid + ' -> image -> ' + image_name + ' -> scenario -> ' + scenario_name );

        table_of_containers[ container.pid ] = { process: container, image_identity: image_identity, scenario_identity: scenario_identity, service_port_tcp: service_port.tcp, service_port_udp: service_port.udp, is_initialised: false, version: undefined, is_public: false, last_game_tick: 0, last_game_timestamp: last_game_timestamp, number_of_connected_players: 0 };

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

        if ( /.*\d+\.\d{3}.*/.test( content ) )
        {
            table_of_containers[ pid ].last_game_timestamp = Math.floor( Date.now() / 1000 );
        }

        const chat_message = /.*\[CHAT\]\s(.*):\s(.*)/.exec( content );

        if ( chat_message )
        {
            script.event.trigger( 'script_event_on_container_chat', [ pid, chat_message[ 1 ], table_of_containers[ pid ].version, chat_message[ 2 ] ] );

            // discord_embedded_message( 'bananas', 'Message', '**' + chat_message[ 1 ] + '** *' + chat_message[ 2 ] + '*', 0x00ff00 );

            return;
        }

        const adding_or_removing_peer = /.*(adding|removing)\speer\(\d+\).*/.exec( content );

        if ( adding_or_removing_peer )
        {
            if ( adding_or_removing_peer[ 1 ] == 'adding' )
            {
                table_of_containers[ pid ].number_of_connected_players += 1;
            }

            if ( adding_or_removing_peer[ 1 ] == 'removing' )
            {
                table_of_containers[ pid ].number_of_connected_players -= 1;
            }

            return;
        }

        const last_game_tick = /^\[GAME_TICK\](\d+)$/.exec( content );

        if ( last_game_tick )
        {
            table_of_containers[ pid ].last_game_tick = last_game_tick[ 1 ];

            return;
        }

        const support_request = /^\[SUPPORT\](.*)\[REQUEST\](.*)$/.exec( content );

        if ( support_request )
        {
            fs.appendFile( 'support_request.txt', '\n' + Math.floor( Date.now() / 1000 ) + ' -- ' + table_of_containers[ pid ].version + ' -- ' + support_request[ 1 ] + ' -- ' + support_request[ 2 ], ( error ) => {} );

            table_of_containers[ pid ].process.stdin.write( '/silent-command game.players[ "' + support_request[ 1 ] + '" ].print( "Assimilation completed. Thank you very much.", { r = 1, g = 0, b = 1 } )\n' );

            return;
        }

        const error_occurred = /.*(Error\s.*)/.exec( content );

        if ( error_occurred )
        {
            script.event.trigger( 'script_event_on_container_error', [ pid, error_occurred[ 1 ] ] );

            // discord_embedded_message( 'bananas', 'Error', table_of_stages.error.replace( '__ERROR__', error_occurred[ 1 ] ), 0xff0000 );

            return;
        }

        if ( table_of_containers[ pid ].version == undefined )
        {
            const container_version = /.*Factorio\s(.*)\s\(build.*\).*/.exec( content );

            if ( container_version )
            {
                table_of_containers[ pid ].version = container_version[ 1 ];

                return;
            }
        }

        if ( table_of_containers[ pid ].is_initialised == false )
        {
            const is_initialised = /.*Factorio\sinitialised$/.exec( content );

            if ( is_initialised )
            {
                table_of_containers[ pid ].is_initialised = true;

                const scenario_identity = table_of_containers[ pid ].scenario_identity;

                table_of_containers[ pid ].process.stdin.write( '/config set name ' + table_of_scenarios[ scenario_identity ].label + ' ' + table_of_scenarios[ scenario_identity ].name + '\n' );

                table_of_containers[ pid ].process.stdin.write( '/config set description ' + table_of_scenarios[ scenario_identity ].description + '\n' );

                table_of_containers[ pid ].process.stdin.write( '/config set tags ' + table_of_scenarios[ scenario_identity ].tags + '\n' );

                table_of_containers[ pid ].process.stdin.write( '/config set max-upload-slots 1\n' );

                table_of_containers[ pid ].process.stdin.write( '/config set max-upload-speed ' + upload_speed.maximum + '\n' );

                return;
            }
        }

        if ( table_of_containers[ pid ].is_public == false )
        {
            const is_public = /.*Matching\sserver\sconnection\sresumed.*/.test( content );

            if ( is_public )
            {
                table_of_containers[ pid ].is_public = true;

                script.event.trigger( 'script_event_on_container_status', [ pid, 'is_public' ] );

                // table_of_containers[ pid ].process.stdin.write( '/silent-command local bla = require( "utils.server" ) bla.set_time(' + Math.floor( Date.now() / 1000 ) + ') bla.query_online_players() \n' );

                return;
            }
        }
    }

    function handle_on_container_error( pid, error )
    {
        // script.event.trigger( 'script_event_on_container_error', [ pid, error.toString().trim() ] );
    }

    function handle_on_container_close( pid, close )
    {
        script.event.trigger( 'script_event_on_container_close', pid );

        const image_identity = table_of_containers[ pid ].image_identity;

        table_of_images[ image_identity ].number_of_containers_running -= 1;

        delete table_of_containers[ pid ];
    }

    function handle_on_console_sigint()
    {
        for ( let [ container_key, container_value ] of Object.entries( table_of_containers ) )
        {
            // const scenario_identity = container_value.scenario_identity;

            // container_value.process.stdin.write( '/server-save ' + table_of_scenarios[ scenario_identity ].name + '-' + Date.now() + '-' + container_key + '\n' );

            container_value.process.kill( 'SIGTERM' );
        }

        if ( typeof instance_container_status != 'undefined' )
        {
            clearInterval( instance_container_status );
        }

        if ( typeof instance_web_access != 'undefined' )
        {
            instance_web_access.close();
        }
    }

    process.on( 'SIGINT', handle_on_console_sigint );

    const maximum_idle_time_of_a_container = 259200;

    function handle_on_container_status()
    {
        const current_cpu_usage = get_cpu_usage();

        const memory_size_free = os.freemem()

        const memory_size_total = os.totalmem();

        const cpu_percent = Math.floor( ( 1 - ( ( current_cpu_usage.idle - last_cpu_usage.idle ) / ( current_cpu_usage.total - last_cpu_usage.total ) ) ) * 100 );

        const memory_percent = Math.floor( ( ( memory_size_total - memory_size_free ) / memory_size_total ) * 100 );

        if ( cpu_percent <= 50 && memory_percent <= 95 )
        {
            for ( let [ image_key, image_value ] of Object.entries( table_of_images ) )
            {
                for ( let [ scenario_key, scenario_value ] of Object.entries( table_of_scenarios ) )
                {
                    if ( image_value.number_of_containers_running == 0 || image_value.further_start_desired == true )
                    {
                        image_value.number_of_containers_running += 1;

                        image_value.further_start_desired = false;

                        const image_identity = image_key;

                        const image_name = image_value.name;

                        const scenario_identity = scenario_key;

                        const scenario_name = scenario_value.name;

                        docker_run_container( image_identity, image_name, scenario_identity, scenario_name );

                        service_port.tcp += 1;

                        service_port.udp += 1;

                        break;
                    }
                }
            }

            const current_timestamp = Math.floor( Date.now() / 1000 );

            for ( let [ container_key, container_value ] of Object.entries( table_of_containers ) )
            {
                if ( container_value.last_game_tick > 216000 && current_timestamp - container_value.last_game_timestamp > maximum_idle_time_of_a_container && container_value.number_of_connected_players <= 0 )
                {
                    script.event.trigger( 'script_event_on_container_stop', container_key );
                }
            }
        }

        last_cpu_usage = current_cpu_usage;
    }

    function get_cpu_usage()
    {
        const cpus = os.cpus();

        let usage = { 'idle': 0, 'total': 0 };

        for ( let cpu in cpus )
        {
            usage.idle += cpus[ cpu ].times.idle;

            usage.total += cpus[ cpu ].times.user + cpus[ cpu ].times.nice + cpus[ cpu ].times.sys + cpus[ cpu ].times.idle + cpus[ cpu ].times.irq;
        }

        return usage;
    }

    let last_cpu_usage = get_cpu_usage();

    const instance_container_status = setInterval( handle_on_container_status, 1000 );

    //-------------------------------------------------
    // WEB ACCESS
    //-------------------------------------------------

    const instance_web_access = http.createServer( handle_on_web_access ).listen( 80 );

    function handle_on_web_access( request, response )
    {
        let content = '';

        if ( /^\/$/.test( request.url ) )
        {
            for ( let [ container_key, container_value ] of Object.entries( table_of_containers ) )
            {
                if ( container_value.is_initialised )
                {
                    container_value.process.stdin.write( '/silent-command local print_override = require( "utils.print_override" ) print_override.raw_print( "[GAME_TICK]" .. game.tick )\n' );
                }
            }

            response.writeHead( 200, { 'Content-Type': 'text/html' } );

            content += '<!DOCTYPE html><title>Node Factorio Manager</title><meta charset="utf-8"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="black"><meta name="format-detection" content="telephone=no"><meta name="viewport" content="width=device-width, minimum-scale=1.0, maximum-scale=5.0">';

            content += '<style type="text/css">*{margin:0;padding:0;text-decoration:none;text-rendering:auto;box-sizing:border-box;font-size:100%;font-family:monospace;}table{table-layout:auto;border-collapse:collapse;width:100%;text-align:center;}th{padding:0;font-weight:normal;}td{padding:0;border:1px solid black;}</style>';

            content += '<table><tr><th>image_name</th><th>scenario_name</th><th>players</th><th>last_game_tick</th><th>last_game_timestamp</th><th>tcp</th><th>udp</th></tr>';

            for ( let [ container_key, container_value ] of Object.entries( table_of_containers ) )
            {
                const image_identity = container_value.image_identity;

                const image_name = table_of_images[ image_identity ].name;

                const scenario_identity = container_value.scenario_identity;

                const scenario_name = table_of_scenarios[ scenario_identity ].name;

                const datetime = new Date( container_value.last_game_timestamp * 1000 );

                const last_game_timestamp = ( datetime.getHours() < 10 ? '0' + datetime.getHours() : datetime.getHours() ) + ':' + ( datetime.getMinutes() < 10 ? '0' + datetime.getMinutes() : datetime.getMinutes() );

                content += '<tr><td>' + image_name + '</td><td>' + scenario_name + '</td><td>' + container_value.number_of_connected_players + '</td><td>' + container_value.last_game_tick + '</td><td>' + last_game_timestamp + '</td><td>' + container_value.service_port_tcp + '</td><td>' + container_value.service_port_udp + '</td></tr>';
            }

            content += '</table>';
        }

        if ( /^\/status$/.test( request.url ) )
        {
            response.writeHead( 200, { 'Content-Type': 'text/plain' } );
        }

        if ( /^\/players$/.test( request.url ) )
        {
            response.writeHead( 200, { 'Content-Type': 'application/json' } );

            content = '{"players":"0"}';
        }

        response.end( content );
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
                // nmap -p 34197 -sU localhost | grep open

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
                // const { server } = this
                // if (!user) {
                //   server.events.trigger('error', { name: 'kick', invoker, time: new Date(), data: 'No user specified' })
                //   return
                // }
                // server.process.stdin.write(`/silent-command game.kick_player('${user}', '${reason}')\n`)
                // server.events.trigger('success', { name: 'kick', invoker, time: new Date(), data: [user, reason] })
            }
            else if ( message.content.startsWith( '!ban' ) )
            {
                // const { server } = this
                // if (!user) {
                //   server.events.trigger('error', { name: 'ban', invoker, time: new Date(), data: 'No user specified' })
                //   return
                // }
                // server.process.stdin.write(`/silent-command game.ban_player('${user}', '${reason}')\n`)
                // server.events.trigger('success', { name: 'ban', invoker, time: new Date(), data: [user, reason] })
            }
            else if ( message.content.startsWith( '!unban' ) )
            {
                // const { server } = this
                // if (!user) {
                //   server.events.trigger('error', { name: 'unban', invoker, time: new Date(), data: 'No user specified' })
                //   return
                // }
                // server.process.stdin.write(`/silent-command game.unban_player('${user}')\n`)
                // server.events.trigger('success', { name: 'unban', invoker, time: new Date(), data: [user] })
            }
            else if ( message.content.startsWith( '!promote' ) )
            {
                // const { server } = this
                // if (!user) {
                //   server.events.trigger('error', { name: 'promote', invoker, time: new Date(), data: 'No user specified' })
                //   return
                // }
                // server.process.stdin.write(`/silent-command if game.players['${user}'] then game.players['${user}'].admin = true end\n`)
                // server.events.trigger('success', { name: 'promote', invoker, time: new Date(), data: [user] })
            }
            else if ( message.content.startsWith( '!demote' ) )
            {
                // const { server } = this
                // if (!user) {
                //   server.events.trigger('error', { name: 'promote', invoker, time: new Date(), data: 'No user specified' })
                //   return
                // }
                // server.process.stdin.write(`/silent-command if game.players['${user}'] then game.players['${user}'].admin = false end\n`)
                // server.events.trigger('success', { name: 'promote', invoker, time: new Date(), data: [user] })
            }
        }
        else
        {
            // const content = escape_string( message.cleanContent );

            // script.event.trigger( 'script_event_on_container_chat', [ 0, message.author.username, '0.0.0', '[Discord] ' + content ] );
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

        // const { roles, commands } = this.options
        // const permission = commands[command].permissions
        // let userRole = roles.length - 1

        // for(let index in roles){
        //   if(message.member.roles.find(r => r.name === roles[index])){
        //     userRole = index
        //     break
        //   }
        // }

        // const requiredRole = roles.indexOf(permission)

        // if(requiredRole >= userRole)
        //   return true
        // else
        //   return false

        return true;
    }

    const discord_embedded_message = ( name_of_channel, title, message, color = 0xff0000 ) =>
    {
        const handle = discord.client.channels.find( ( channel ) => channel.name === name_of_channel );

        // if(attachment)
        //   return channel.send(embed.attachFile(attachment))
        // else
        //   return channel.send(embed)

        if ( handle != false )
        {
            handle.send( new RichEmbed().setTimestamp().setTitle( '**' + title + '**' ).setColor( color ).setDescription( message ) );
        }
    }

    function human_readable_file_size( bytes, precision = 2 )
    {
        if ( bytes === 0 )
        {
            return '0 Bytes';
        }

        const dm = precision < 0 ? 0 : precision;

        const label = [ 'Bytes', 'KByte', 'MByte', 'GByte', 'TByte', 'PByte', 'EByte', 'ZByte', 'YByte' ];

        const index = Math.floor( Math.log( bytes ) / Math.log( 1024 ) );

        return parseFloat( ( bytes / Math.pow( 1024, index ) ).toFixed( dm ) ) + ' ' + label[ index ];
    }
