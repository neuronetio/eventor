var Eventor = (function(){

"use strict";

class EventorBasic {

  constructor(opts){
    this._listeners = {};
    this._allListeners = {};
    this._wildcardListeners = {};
    this._allWildcardListeners = [];
    this.delimeter=".";
    this._shared = opts._shared;
    if(typeof opts.delimeter=="string"){
      if(opts.delimeter.length>1){
        throw new Error("Delimeter should be one character long.");
      }
      this.delimeter=opts.delimeter;
    }

  }

  generateId(){
    return ++this._shared.lastId;
  }
  /**
   * start listening to an event
   * arguments:
   *  eventName {String}, callback {function}, position(optional) {integer}
   *  nameSpace {String}, eventName {string}, callback {function}, position (optional) {integer}
   *
   */
  on(){
    let eventName="";
    let callback = ()=>{};
    let nameSpace = "";
    // by default nameSpace is "" because we later can call only those
    // listeners with no nameSpace by emit("","eventName"); nameSpace("")===nameSpace("")
    let args = Array.prototype.slice.call(arguments);
    let isBefore=false;
    let isAfter=false;
    let isAfterAll=false;
    let emptyArgs=false;
    args.forEach((arg)=>{
      if(typeof arg==="undefined" || arg==null){emptyArgs=true;}
    })
    if(emptyArgs){return false;}
    if(typeof args[0]!=="string" && args[0].constructor.name!="RegExp"){
      throw new TypeError("First argument should be string or RegExp in Eventor.on method");
    }
    if(typeof args[1]==="function"){// eventName,callback, "before" or "after"
      eventName=args[0];
      callback=args[1];
      if(typeof args[2]==="string"){
        if(args[2]==="before"){isBefore=true;}
        if(args[2]==="after"){isAfter=true;}
        if(args[2]==="afterAll"){isAfterAll=true;}
      }
    }else if(
      typeof args[0]==="string" &&
      (typeof args[1]==="string" || args[1].constructor.name==="RegExp") &&
      typeof args[2]==="function"
    ){// nameSpace, eventName, callback,"before" or "after"
      nameSpace=args[0];
      eventName=args[1];
      callback=args[2];
      if(typeof args[3]==="string"){
        if(args[3]==="before"){isBefore=true;}
        if(args[3]==="after"){isAfter=true;}
        if(args[2]==="afterAll"){isAfterAll=true;}
      }
    }else{ // second argument is not a callback and not a eventname
      throw new TypeError("Second argument should be string or function (callback) in Eventor.on method");
    }

    const wildcarded=eventName.constructor.name=="RegExp" || eventName.indexOf("*")>=0;
    const listenerId = this.generateId();
    let listener = {
      id:listenerId,
      eventName,
      callback,
      nameSpace,
      isWildcard:wildcarded,
      isBefore,
      isAfter,
      isAfterAll
    };

    if(!wildcarded){
      if(typeof this._listeners[eventName] == "undefined"){
        this._listeners[eventName]=[];
      }
      this._listeners[eventName].push(listener);
    }else{
      const regstr=eventName.toString();
      if(typeof this._wildcardListeners[regstr]=="undefined"){
        this._wildcardListeners[regstr]=[];
      }
      this._wildcardListeners[regstr].push(listener);
      this._allWildcardListeners.push(listener);
    }
    this._allListeners[listenerId]=listener;
    return listenerId;
  }


  removeListener(listenerId){
    let listener = this._allListeners[listenerId];
    let eventName = listener.eventName;
    if(!listener.isWildcard){
      let pos = this._listeners[eventName].indexOf(listener);
      this._listeners[eventName].splice(pos,1);
    }else{
      let pos = this._wildcardListeners[eventName].indexOf(listener);
      this._wildcardListeners[eventName].splice(pos,1);
    }
    delete this._allListeners[listenerId];
  }

  off(){
    let args = Array.prototype.slice.call(arguments);
    return this.removeListener.apply(this,args);
  }

  removeNameSpaceListeners(nameSpace){
    let listeners = this.getNameSpaceListeners(nameSpace);
    let ids = [];
    listeners.forEach((listener)=>{
      ids.push(listener.id);
    });
    ids.forEach((id)=>{
      this.removeListener(id);
    });
    return ids.length;
  }

  wildcardMatchEventName(wildcard,eventName){
    if(typeof wildcard=="string"){
      let str=wildcard
      .replace(/[^a-z0-9]{1}/gi,"\\$&")
      .replace(/\\\*\\\*/gi,".*")
      .replace(/\\\*/gi,"[^\\"+this.delimeter+"]*");
      str="^"+str+"$";
      wildcard=new RegExp(str);
    }
    return eventName.match(wildcard);
  }

  _getListenersForEvent(eventName){
    let listeners = [];
    if(typeof this._listeners[eventName]!="undefined"){
      listeners = this._listeners[eventName];
    }

    // now we must add wildcards
    // listener from now on will have _tempMatches property
    // which will change between different events when eventName argument change
    let wildcarded = this._allWildcardListeners.map((listener)=>{
      listener._tempMatches = this.wildcardMatchEventName(listener.eventName,eventName);
      return listener;
    }).filter((listener)=>{
      return listener._tempMatches!=null;
    });
    listeners = [...listeners,...wildcarded];
    // it is better to sort couple of events instead of changing core structure
    listeners.sort(function(a,b){
      return a.id - b.id;
    });
    return listeners;
  }

  _getListenersForEventFromArray(eventName,listeners){
    // listeners may be list of all different listeners types (namespaced, wildcarded...)
    return listeners.filter((listener)=>{
      if(listener.isWildcard){
        listener._tempMatches = this.wildcardMatchEventName(listener.eventName,eventName);
        return listener._tempMatches!=null;
      }else{
        return listener.eventName===eventName;
      }
    }).sort(function(a,b){
      return a.id - b.id;
    });
  }

  listeners(...args){
    if(args.length===0){
      let all=[];
      for(let listenerId in this._allListeners){
        all.push(this._allListeners[listenerId]);
      }
      return all;
    }else if(args.length==1){
      return this._getListenersForEvent(args[0]);
    }else if(args.length==2){
      let listeners=this.getNameSpaceListeners(args[0]);
      return this._getListenersForEventFromArray(args[1],listeners);
    }
  }

  getNameSpaceListeners(nameSpace){
    let all = this.listeners();
    let result=all.filter((listener)=>{
      return listener.nameSpace===nameSpace;
    });
    return result;
  }

  // it is used to emit or cascade
  _parseArguments(args){
    let result = {};
    result.eventName="";
    result.data = undefined;
    result.nameSpace = undefined;
    // namepsace=undefined (not "") because we need to know if nameSpace was
    // in the argument list
    // if yes we will be filtering to match namespace
    // if no we return all listeners (with namespaces or not)
    // it is usefull when we need to get only those listeners that have no namespace assigned
    // because when no namespace is passed as argument for on("eventName") method - listener will have
    // empty string as namespace by default "" to easily search for listeners with no namepsace
    // by setting empty string as namespace to match
    //
    // for example:
    //    emit("","eventName") will call only those listeners that have no namespaces
    //    emit("eventName") will call all listeners including those with namespace
    //    emit("someNameSpace","eventName") will call only listeners with "someNameSpace" as namespace
    //
    // we could emit something like this emit(undefined,"eventName") to get listeners without namespaces
    // but it looks ugly and not intuitive
    // default namespace ("") is the better choice
    if(typeof args[0] == "string"){

      if(args.length==1){//eventName
        return false; // emitted event must have a data to emit
      }else if(args.length==2){//eventName,data
        result.eventName = args[0];
        result.data = args[1];
      }else if(args.length==3){//nameSpace,eventName,data
        result.nameSpace = args[0];
        result.eventName = args[1];
        result.data = args[2];
      }else{
        return false;
      }

    }else{
      return false;
    }

    return result;
  }

  _getListenersFromParsedArguments(parsedArgs){
    let listeners = [];
    if(typeof parsedArgs.nameSpace==="undefined"){
      listeners = this.listeners(parsedArgs.eventName);
    }else{
      listeners = this.listeners(parsedArgs.eventName);
      listeners=listeners.filter((listener)=>{
        return listener.nameSpace===parsedArgs.nameSpace;
      });
    }
    return listeners;
  }

  /**
   * after is optional argument and in most cases should not be used
   * after is an object with _after EventorBasic and parsedArgs to emit
   * after._after , after.parsedArgs
   */
  _emit(parsedArgs,after){
    //let args = Array.prototype.slice.call(arguments);
    //let parsedArgs = this._parseArguments(args);
    let results = [];
    let listeners = this._getListenersFromParsedArguments(parsedArgs);// _tempMatches

    listeners.forEach((listener)=>{
      // in the case if someone accidently modify event object
      let eventObj = Object.assign({},parsedArgs.event);
      eventObj.listener = listener;
      // _tempMatches are only temporairy data from _getListenersForEvent
      // becase we don't want to parse regex multiple times (performance)
      eventObj.matches = listener._tempMatches;
      delete listener._tempMatches;
      let promise=listener.callback(parsedArgs.data,eventObj);

      if(typeof after!="undefined"){
        // we have an after job to do before all of the task resolves
        if(promise instanceof Promise){
          promise = promise.then((result)=>{
            after.parsedArgs.data=result;
            return after._after._cascade(after.parsedArgs);
          });
        }else{
          // if listener doesn't return a promise we must make it
          after.parsedArgs.data=promise;// promise is a normal value
          promise=after._after._cascade(after.parsedArgs);
        }
      }
      results.push(promise);
    });
    return Promise.all(results);
  }

  _validateArgs(args){
    let parsedArgs=this._parseArguments(args);
    return parsedArgs;
  }

  /**
   * emit an event
   * arguments:
   *  eventName {string}, data {any}
   *  nameSpace {string}, eventName {string}, data {any}
   */
  emit(){
    let args = Array.prototype.slice.call(arguments);
    let parsedArgs=this._validateArgs(args);
    parsedArgs.event={
      type:"emit",
      eventName:parsedArgs.eventName,
      nameSpace:parsedArgs.nameSpace,
      isBefore:parsedArgs.isBefore,
      isAfter:parsedArgs.isAfter,
      isAfterAll:parsedArgs.isAfterAll
    }
    return this._emit(parsedArgs);
  }

  _cascade(parsedArgs){
    let listeners = this._getListenersFromParsedArguments(parsedArgs);
    let result = Promise.resolve(parsedArgs.data);
    listeners.forEach((listener,index)=>{
      result=result.then((currentData)=>{
        let eventObj = Object.assign({},parsedArgs.event);
        eventObj.listener = listener;
        // _tempMatches are only temporairy data from _getListenersForEvent
        // becase we don't want to parse regex multiple times (performance)
        eventObj.matches = listener._tempMatches;
        delete listener._tempMatches;
        return listener.callback(currentData,eventObj);
      });
    });
    return result;
  }

  /**
   * emit an event and put result of each one to next listener (waterfall)
   * arguments:
   *  eventName {string}, data {any}
   *  nameSpace {string}, eventName {string}, data {any}
   */
  cascade(){
    let args = Array.prototype.slice.call(arguments);
    let parsedArgs = this._validateArgs(args);
    parsedArgs.event={
      type:"cascade",
      eventName:parsedArgs.eventName,
      nameSpace:parsedArgs.nameSpace,
      isBefore:parsedArgs.isBefore,
      isAfter:parsedArgs.isAfter,
      isAfterAll:parsedArgs.isAfterAll
    }
    return this._cascade(parsedArgs);
  }

}


function Eventor(opts){

  let root={};

  opts = opts || {};
  let sharedData={
    lastId:0
  };
  opts._shared=sharedData;
  root._before = new EventorBasic(opts);
  root._normal = new EventorBasic(opts);
  root._after = new EventorBasic(opts);
  root._afterAll = new EventorBasic(opts);


  root.on=function on(...args){
    return root._normal.on.apply(root._normal,args);
  }

  root.removeListener=function removeListener(listenerId){
    listenerId=listenerId.toString();
    if( Object.keys(root._normal._allListeners).indexOf(listenerId)>=0 ){
      return root._normal.removeListener.apply(root._normal,[listenerId]);
    }else if( Object.keys(root._before._allListeners).indexOf(listenerId)>=0 ){
      return root._before.removeListener.apply(root._before,[listenerId]);
    }else if( Object.keys(root._after._allListeners).indexOf(listenerId)>=0 ){
      return root._after.removeListener.apply(root._after,[listenerId]);
    }else if( Object.keys(root._afterAll._allListeners).indexOf(listenerId)>=0 ){
      return root._afterAll.removeListener.apply(root._afterAll,[listenerId]);
    }else{
      let error=new Error("No listener found with specified id ["+listenerId+"]");
      //root._normal.emit("error",error);
      throw error;
    }
  }

  root.before=function before(...args){
    return root._before.on.apply(root._before,args);
  }

  root.after=function after(...args){
    return root._after.on.apply(root._after,args);
  }

  root.afterAll=function afterAll(...args){
    return root._afterAll.on.apply(root._afterAll,args);
  }

  root.emit=function emit(...args){
    let beforeParsed = root._normal._parseArguments(args);
    beforeParsed.event={
      type:"emit",
      eventName:beforeParsed.eventName,
      nameSpace:beforeParsed.nameSpace,
      isBefore:true,
      isAfter:false,
      isAfterAll:false
    }
    return root._before._cascade(beforeParsed)
    .then((input)=>{
      let normalParsed = Object.assign({},beforeParsed);
      normalParsed.data=input;
      normalParsed.event={
        type:"emit",
        eventName:normalParsed.eventName,
        nameSpace:normalParsed.nameSpace,
        isBefore:false,
        isAfter:false,
        isAfterAll:false,
      }

      let afterParsedArgs = Object.assign({},beforeParsed);
      afterParsedArgs.data=undefined;
      afterParsedArgs.event={
        type:"emit",
        eventName:afterParsedArgs.eventName,
        nameSpace:afterParsedArgs.nameSpace,
        isBefore:false,
        isAfter:true,
        isAfterAll:false,
      }
      let after={
        _after:root._after,
        parsedArgs:afterParsedArgs
      }

      return root._normal._emit(normalParsed,after);

    }).then((results)=>{
      let afterParsed = Object.assign({},beforeParsed);
      afterParsed.data=results;
      afterParsed.event={
        type:"emit",
        eventName:afterParsed.eventName,
        nameSpace:afterParsed.nameSpace,
        isBefore:false,
        isAfter:false,
        isAfterAll:true
      }
      // in afterAll we are running one callback to array of all results
      return root._afterAll._cascade(afterParsed);
    });
  }

  root.cascade=function cascade(...args){
    let beforeParsed = root._normal._parseArguments(args);
    beforeParsed.event={
      type:"cascade",
      eventName:beforeParsed.eventName,
      nameSpace:beforeParsed.nameSpace,
      isBefore:true,
      isAfter:false,
      isAfterAll:false,
    }
    return root._before._cascade(beforeParsed)
    .then((input)=>{
      let normalParsed = Object.assign({},beforeParsed);
      normalParsed.data=input;
      normalParsed.event={
        type:"cascade",
        eventName:normalParsed.eventName,
        nameSpace:normalParsed.nameSpace,
        isBefore:false,
        isAfter:false,
        isAfterAll:false,
      }
      return root._normal._cascade(normalParsed);
    }).then((results)=>{
      let afterParsed = Object.assign({},beforeParsed);
      afterParsed.data=results;
      afterParsed.event={
        type:"cascade",
        eventName:afterParsed.eventName,
        nameSpace:afterParsed.nameSpace,
        isBefore:false,
        isAfter:true,
        isAfterAll:false
      }
      return root._after._cascade(afterParsed);
    }).then((results)=>{
      let afterParsed = Object.assign({},beforeParsed);
      afterParsed.data=results;
      afterParsed.event={
        type:"cascade",
        eventName:afterParsed.eventName,
        nameSpace:afterParsed.nameSpace,
        isBefore:false,
        isAfter:false,
        isAfterAll:true
      }
      return root._afterAll._cascade(afterParsed);
    });
  }

  root.listeners=function listeners(...args){
    return root._normal.listeners.apply(root._normal,args);
  }

  root.allListeners=function allListeners(...args){
    return [
      ...root._before.listeners.apply(root._before,args),
      ...root._normal.listeners.apply(root._normal,args),
      ...root._after.listeners.apply(root._after,args),
      ...root._afterAll.listeners.apply(root._afterAll,args)
    ];
  }

  root.getNameSpaceListeners=function getNameSpaceListeners(...args){
    return root._normal.getNameSpaceListeners.apply(root._normal,args);
  }

  root.getAllNameSpaceListeners=function getAllNameSpaceListeners(...args){
    return [
      ...root._before.getNameSpaceListeners.apply(root._before,args),
      ...root._normal.getNameSpaceListeners.apply(root._normal,args),
      ...root._after.getNameSpaceListeners.apply(root._after,args),
      ...root._afterAll.getNameSpaceListeners.apply(root._afterAll,args)
    ];
  }

  root.removeNameSpaceListeners=function removeNameSpaceListeners(...args){
    return root._normal.removeNameSpaceListeners.apply(root._normal,args);
  }

  root.removeAllNameSpaceListeners=function removeAllNameSpaceListeners(...args){
    return root._normal.removeNameSpaceListeners.apply(root._normal,args)+
    root._before.removeNameSpaceListeners.apply(root._before,args)+
    root._after.removeNameSpaceListeners.apply(root._after,args)+
    root._afterAll.removeNameSpaceListeners.apply(root._afterAll,args);
  }

  root.wildcardMatchEventName=function wildcardMatchEventName(...args){
    return root._normal.wildcardMatchEventName.apply(root._normal,args);
  }

  return root;
}

return Eventor;

}());

if(typeof module!="undefined"){
  if(typeof module.exports!="undefined"){
    module.exports = Eventor;
  }
}
