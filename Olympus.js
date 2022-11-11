let ns;

const debug = true;
const autoRoot = true;
const programsNeeded = ['Olympus.js', 'attackWatcher.js', 'batchServerFinder.js'];
const maxRam = 1.75;
/*
    [Olympus V1.0.0?]

    Port Structure:

        * Target Identifiers
    Port( 1): Target Name,
    Port( 2): Organization Name
    Port( 3): Ip
    Port( 4): Status ( INITIATED | UNREADY | READY )
    
        * Target Stats
    Port( 5): Max Ram
    Port( 6): Used Ram

    Port( 7): Maxmimum Money
    Port( 8): Money Needed ( %s Max-Min, %s Threads Needed)
    Port( 9): Money Available
    
    Port( 10): Base Security
    Port( 11): Minimum Security
    Port( 12): Current Security

    Port( 13): Ports Open
    Port( 14): SSH
    Port( 15): FTP
    Port( 16): SMTP
    Port( 17): HTTP
    Port( 18): SQL
*/
/*
    import { CONSTANTS } from "../../Constants";
    import { Server } from "../Server";
    import { BitNodeMultipliers } from "../../BitNode/BitNodeMultipliers";
    import { Person } from "../../PersonObjects/Person";
*/


let hacksStarter = [
    {
        target: 'foodnstuff',
        method: 'weaken',
        startTime: Date.now(),
        future: Date.now()+10000,
    },
];
async function gainRoot( server){
    if( !await ns.hasRootAccess( server)) {    
        try{ 
            await ns.brutessh( server);
        } catch{};
        try{ 
            await ns.ftpcrack( server);
            } catch{};
            try{ 
            await    ns.relaysmtp( server);
            } catch{};
            try{ 
            await    ns.httpworm( server);
            } catch{};
            try{
            await    ns.sqlinject( server);
            } catch{};
            try{
            await    ns.nuke( server);
            } catch{};
            if ( await ns.hasRootAccess( server)&& debug) {
            await    ns.printf('INFO Root gained for {%s}', server);
            };
        } else { return true};
        return await ns.hasRootAccess( server);
    }
async function getSlaves( servers, shouldTryRoot= autoRoot!= undefined? autoRoot: false){
    /*
    Returns a list of servers that hasRootAccess in list servers [ 'servername', 'servername];
    
    Returns a servers that hasRootAccess;
    Attempt to gain Root if ( const: bool): autoRoot
    */
   let _slaves = []; // Iniate _slaves Array[];
   for (let i= 0; i< servers.length; i++){
       let server = servers[i];
       if( shouldTryRoot){ // If we should attempt to gain Root on new Servers
        await gainRoot( server); // -> gainRoot(( Object: [netscript]) ns, ( var: [str]) server);
    }
    if( await ns.hasRootAccess( server)){
        _slaves.push( server);
    };
};
return _slaves;
}


async function generateServerlists() { 
    /*
    Get server-list by Looping through all servers, and scanning surroundings
    */
   let _slaveRam = 0;
   let _serverList = []; // Initiate _serverList Array[];
   function scan( Server) { 
       let curScan = ns.scan( Server).forEach(server=>{
            if (!_serverList.includes(server)) { // If server isnt in Completed List
                _serverList.push(server); // Add server to Completed List
                scan( server); // Scan this Servers Directory
            };
        });
    };
    await scan( 'home'); // Initiate _serverList fill;
    /*
    Sort Primary use servers
    */
    let _slaveList = await getSlaves( _serverList, autoRoot!= undefined? autoRoot: false);
    for( let i= 0; i< _slaveList; i++){
        _slaveRam= _slaveRam+ await ns.getServerMaxRam(_slaveList[i]);
        
    };
    if( debug){
        //resetConsole( {all: _serverList, slaves: _slaveList});
        //ns.writePort(1, "sigma-cosmetics");
    };
    return { all: _serverList, slaves: _slaveList, slaveRam: _slaveRam};
};
async function deliverAndRun( method, toServer, target, threads, time){
    //ns.printf( "Delivering and running: %s, %s, %s, %s", method, toServer, target, threads);
    if(! await ns.fileExists( method+ 'a.script', toServer)||! await ns.fileExists( method+ 'a.script', 'home')){
        if( await ns.fileExists( method+ 'a.script', 'home')) {
            await ns.scp( method+ 'a.script', toServer, 'home');
        } else { // Home doesnt have files
            await ns.write( method+ 'a.script', "while( Date.now()< args[1]){ sleep( 5); };"+method+ '( args[0])');
            await ns.scp( method+ 'a.script', toServer, 'home');
        };
    };
    let pid= await ns.exec( method+ 'a.script', toServer, threads, target, time);
    if( !pid){
        ns.tprint('Failed to execute...?');
    } else {
        /*
            run attackWatcher.js here

        */
        //await ns.tail( pid);
    }
};

async function resetConsole( _serverList, shouldRefresh= false){
    ns.disableLog( "ALL");
    //ns.enableLog("exec");
    ns.clearLog();
    shouldRefresh? _serverList = await generateServerlists(): '';
    //ns.printf(JSON.stringify(_serverList));
    let _allServers = _serverList.all;
    let _slaveServers = _serverList.slaves;
    ns.printf('[%s] Servers loaded | [%s/ %s gb] Slaves loaded | Target loaded [%s]', _allServers.length, _slaveServers.length, _serverList.slaveRam, await ns.peek(1)!= "NULL PORT DATA"? await ns.peek( 1): "NO TARGET");//ns.getServer(ns.peek(1)).ip: "NO TARGET");
};
async function allocateAttack( method, threads, dedicatedServers, time){
    if(time== undefined){
        time= 0;
    };
    threads= Math.ceil( threads);
    //ns.printf( "%s %s", method, threads);
    if (threads< 1){
        return false, ns.tprint("Attempt Allocated Non-Needed Attack");
    } else {
        threads = Math.ceil(threads);
    };
    let target = await getTarget();
    let serversUsed = 0;
    let threadsUsed = 0;
    for( let i=0; i< dedicatedServers.length; ++i) {
        if( threadsUsed>= threads){
            return {ret: true};
        };
        //ns.printf("%s/%s",threadsUsed,threads);
        let thisServer = dedicatedServers[i];
        let availableRam = await ns.getServerMaxRam(thisServer) - await ns.getServerUsedRam(thisServer);
        if( !availableRam< maxRam) { // if server has more Ram than Maximum payload size
            let threadsForThis = Math.floor(Math.min(threads-threadsUsed, availableRam/ ns.getScriptRam( method+'.script')));
            if( threadsForThis>= 1){//&& threadsUsed+ threadsForThis <= threads){
                await deliverAndRun( method, thisServer, target, threadsForThis, time);
                threadsUsed= threadsUsed+ threadsForThis;
                if( threadsUsed== threads){
                    return {ret: true};
                };
            };
        }
    }
    return {ret: false, threadsLeft: (threads- threadsUsed)}; // Couldnt allocate all threads
};
async function prepareServer( server, dedicatedServers, startedHacking){
    let serverInfo = await ns.getServer( server);

    //ns.printf("Preparing %s", server);
    while( (await ns.getServerMoneyAvailable( server)!= serverInfo.moneyMax|| await ns.getServerSecurityLevel( server)!= serverInfo.minDifficulty) && !startedHacking){ // While where not at Full health & full cash
        /*
            Calculate both Grow and Weaken threads here
                and run as a Timed Batch
        */
        while( await ns.getServerSecurityLevel( server)!= serverInfo.minDifficulty&& !startedHacking){ // Force full grow before progressing;
            ns.printf("%s %s", await ns.getServerSecurityLevel( server), serverInfo.minDifficulty);
            let weakenThreadsNeeded = Math.ceil(( await ns.getServerSecurityLevel( server)- serverInfo.minDifficulty)/ await ns.weakenAnalyze(1, 1))* 1.25;
            let weakenTimeNeeded = await ns.getWeakenTime( server);
            let weakenFinishTime = new Date( weakenTimeNeeded+ Date.now());
            let ran = await allocateAttack( 'weaken', weakenThreadsNeeded, dedicatedServers);
            ran.ret? ns.printf("Allocated all %s Threads Needed", weakenThreadsNeeded): ns.printf("ERROR Could'nt Allocate All Threads Needed. R[%s/%s]", ran.threadsLeft, weakenThreadsNeeded);
            let weakenTimeMinutes = Math.ceil((weakenThreadsNeeded/ 1000)/ 60);
            let weakenTimeSeconds = Math.ceil((weakenTimeNeeded/ 1000)% 60);
            ns.printf("Time till weaken: %s m %s s", weakenTimeMinutes, weakenTimeSeconds);
            ns.printf("INFO Completion At: %s", weakenFinishTime.toLocaleTimeString('en-US'));
            await ns.sleep(weakenTimeNeeded+350);
        };
        let growThreadsNeeded= Math.ceil( await ns.growthAnalyze( server, await ns.getServerMaxMoney( server)/ await ns.getServerMoneyAvailable( server)))* 1.125;
        if( growThreadsNeeded>= 1){
            ns.tprint("Grow Threads Needed: "+growThreadsNeeded);
            let growTimeNeeded= await ns.getGrowTime( server);
            let growFinishTime= new Date( growTimeNeeded+ Date.now());
            let ran = await allocateAttack( 'grow', growThreadsNeeded, dedicatedServers);
            ran.ret? ns.printf("Allocated all %s Threads Needed", growThreadsNeeded): ns.printf("ERROR Could'nt Allocate All Threads Needed. R[%s/%s]", ran.threadsLeft, growThreadsNeeded);
            let growTimeMinutes= Math.ceil(( growThreadsNeeded/ 1000)/ 60);
            let growTimeSeconds= Math.ceil(( growTimeNeeded/ 1000)% 60);
            ns.printf("Time till grow: %s m %s s", growTimeMinutes, growTimeSeconds);
            ns.printf("INFO Completion At: %s", growFinishTime.toLocaleTimeString('en-US'));
            await ns.sleep( growTimeNeeded+350); // Make sure threads finished;
        }
    };
    ns.printf("Prepared %s", server);
};
async function getTarget(){
    return await ns.peek(1)!= "NULL PORT DATA"? await ns.peek(1): null;
} // 1.426
export async function main( netScript) {
    netScript.readPort(1);
    await netScript.writePort(1, 'harakiri-sushi');
    ns= netScript;
    let _loop= 0;
    let _waited= 0;
    let Servers= await generateServerlists( ns);
    await resetConsole( ns, Servers, false);
    ns.printf( '%s', await getTarget());
    ns.printf( 'INFO Olympus Loop Started');
    let startedHacking= false;
    do {
        //ns.printf( 'WARN Loop[%s]', ++_loop);
        ++_loop;
        // Waiting for a Target on port(1);
        _waited = 0;
        while(! await getTarget()) { 
            ns.printf("Waiting for Target. [%s s]", ++_waited);
            await ns.sleep(1000);
        };
        const target = await getTarget();
        let targetInfo = await ns.getServer(target);
        // Have target
        // Prepare target for Batching
        if(! startedHacking|| await ns.getServerMoneyAvailable( target)/ await ns.getServerMaxMoney( target)< .89){
            await prepareServer( await getTarget(), Servers.slaves, startedHacking);
            startedHacking= true;
            await ns.sleep( 1500);
        };
        // Batch target;
        // Least -> Most time til;
        let start = Date.now();
        let timeToHack= await ns.getHackTime( target);
        let timeToGrow= await ns.getGrowTime( target);
        let timeToWeaken= await ns.getWeakenTime( target);
        let finish = new Date( Date.now()+ timeToWeaken+50);

        let Attack= {
            Times:{
                startGrow: 1,
                startWeakenA: 1,
            }
        };
        let startWeakenB= ( finish- ( timeToWeaken));
        let startGrow= ( finish- ( timeToGrow))- 50;
        let startWeakenA= (finish- (timeToWeaken- 100));
        let startHack= (finish- (timeToHack))- 150;
        /*

        Calculate which threads need to be ran in what order to create a complete batch

        */
        let hackThreads= Math.ceil(await ns.hackAnalyzeThreads( target, ( await ns.getServerMaxMoney( target)*.25)));
        let weakenHackThreads= await ns.hackAnalyzeSecurity( hackThreads, target)/ await ns.weakenAnalyze( 1, 1);
        //let weakenThreads= await (ns.hackAnalyzeSecurity(1, target)* targetInfo.serverGrowth)/ await ns.weakenAnalyze(1, 1);
        //ns.printf("%s %s %s", weakenThreads, await ns.hackAnalyzeSecurity(1, target)*hackThreads, await ns.weakenAnalyze(1, 1));
        let growThreads=  Math.ceil( await ns.growthAnalyze( target, 1.25))+ 1;
        let weakenGrowThreads= await ns.growthAnalyzeSecurity( growThreads, target, 1);
        
        //ns.printf( "Start:%s %s->%s, %s->%s", new Date( start).toLocaleTimeString('en-US'), new Date( startHack).toLocaleTimeString('en-US'), new Date( startHack+ timeToHack).toLocaleTimeString('en-US'), new Date( startWeakenB).toLocaleTimeString('en-US'), new Date( startWeakenB+ timeToWeaken));

        await allocateAttack( 'weaken', weakenHackThreads*1.1, Servers.slaves, startWeakenA);
        await allocateAttack( 'weaken', /*weakenGrowThreads*/growThreads/1.6 +5, Servers.slaves, startWeakenB);
        await allocateAttack( 'hack', hackThreads, Servers.slaves,startHack);
        await allocateAttack( 'grow', growThreads*1.4, Servers.slaves, startGrow);
        if( Math.floor( Math.random()*10)== 1){
            await allocateAttack( 'weaken', /*weakenGrowThreads*/growThreads/1.6 +5, Servers.slaves, startWeakenB+ 25);
        };
        //ns.printf('Batch Started');
        let timeTillNextBatch= ( finish- start)/ 250; // Max Possible per Session
        timeTillNextBatch= ( finish- start)/ 60;
        ns.printf("Batch Started. Estimated general Cashout Time: %s ms", Math.ceil(timeTillNextBatch));
        //await ns.sleep(finish- start + 1500);
        await ns.sleep(timeTillNextBatch);// 20ms min Legitmate ms accuracy
    } while( true);
};

//https://open.spotify.com/track/0uu4mxf7vn9A5KVsKDxAen?si=468d0c8709204434
//
//
