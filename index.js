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
    let args = Array.prototype.slice.call(arguments);
    let isBefore=false;
    let isAfter=false;
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
      isAfter
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
      .replace(/\\\*/gi,"[^\\.]*");
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
    let wildcarded = this._allWildcardListeners.map((listener)=>{
      listener.matches = this.wildcardMatchEventName(listener.eventName,eventName);
    }).filter((listener)=>{
      return listener.matches!=null;
    });
    listeners = [...listeners,...wildcarded];
    // it is better to sort couple of events instead of changing core structure
    listeners.sort(function(a,b){
      return a.id - b.id;
    });
    return listeners;
  }

  listeners(...args){
    if(args.length===0){
      let all=[];
      for(let listenerId in this._allListeners){
        all.push(this._allListeners[listenerId]);
      }
      return all;
    }else{
      return this._getListenersForEvent(args[0]);
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
    result.nameSpace = false;
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
    if(!parsedArgs.nameSpace){
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
   * emit an event
   * arguments:
   *  eventName {string}, data {any} ,result {any}
   *  nameSpace {string}, eventName {string}, data {any} ,result {any}
   */
  _emit(parsedArgs){
    //let args = Array.prototype.slice.call(arguments);
    //let parsedArgs = this._parseArguments(args);
    let results = [];
    let listeners = this._getListenersFromParsedArguments(parsedArgs);

    listeners.forEach((listener)=>{
      // in the case if someone accidently modify event object
      let eventObj = Object.assign({},parsedArgs.event);
      eventObj.listener = listener;
      let promise=listener.callback(parsedArgs.data,eventObj);
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
    }
    return this._cascade(parsedArgs);
  }

}


class Eventor {

  constructor(opts){
    opts = opts || {};
    let sharedData={
      lastId:0
    };
    opts._shared=sharedData;
    this._before = new EventorBasic(opts);
    this._normal = new EventorBasic(opts);
    this._after = new EventorBasic(opts);
  }

  on(...args){
    return this._normal.on.apply(this._normal,args);
  }

  removeListener(listenerId){
    listenerId=listenerId.toString();
    if( Object.keys(this._normal._allListeners).indexOf(listenerId)>=0 ){
      return this._normal.removeListener.apply(this._normal,[listenerId]);
    }else if( Object.keys(this._before._allListeners).indexOf(listenerId)>=0 ){
      return this._before.removeListener.apply(this._before,[listenerId]);
    }else if( Object.keys(this._after._allListeners).indexOf(listenerId)>=0 ){
      return this._after.removeListener.apply(this._after,[listenerId]);
    }else{
      let error=new Error("No listener found with specified id ["+listenerId+"]");
      //this._normal.emit("error",error);
      throw error;
    }
  }

  before(...args){
    return this._before.on.apply(this._before,args);
  }

  after(...args){
    return this._after.on.apply(this._after,args);
  }

  emit(...args){
    let beforeParsed = this._normal._parseArguments(args);
    beforeParsed.event={
      type:"emit",
      eventName:beforeParsed.eventName,
      nameSpace:beforeParsed.nameSpace,
      isBefore:true,
      isAfter:false,
    }
    return this._before._cascade(beforeParsed)
    .then((input)=>{
      let normalParsed = Object.assign({},beforeParsed);
      normalParsed.data=input;
      normalParsed.event={
        type:"emit",
        eventName:normalParsed.eventName,
        nameSpace:normalParsed.nameSpace,
        isBefore:false,
        isAfter:false,
      }
      return this._normal._emit(normalParsed);
    }).then((results)=>{
      let afterParsed = Object.assign({},beforeParsed);
      afterParsed.data=results;
      afterParsed.event={
        type:"emit",
        eventName:afterParsed.eventName,
        nameSpace:afterParsed.nameSpace,
        isBefore:false,
        isAfter:true,
      }
      return this._after._cascade(afterParsed);
    });
  }

  cascade(...args){
    let beforeParsed = this._normal._parseArguments(args);
    beforeParsed.event={
      type:"cascade",
      eventName:beforeParsed.eventName,
      nameSpace:beforeParsed.nameSpace,
      isBefore:true,
      isAfter:false,
    }
    return this._before._cascade(beforeParsed)
    .then((input)=>{
      let normalParsed = Object.assign({},beforeParsed);
      normalParsed.data=input;
      normalParsed.event={
        type:"cascade",
        eventName:normalParsed.eventName,
        nameSpace:normalParsed.nameSpace,
        isBefore:false,
        isAfter:false,
      }
      return this._normal._cascade(normalParsed);
    }).then((results)=>{
      let afterParsed = Object.assign({},beforeParsed);
      afterParsed.data=results;
      afterParsed.event={
        type:"cascade",
        eventName:afterParsed.eventName,
        nameSpace:afterParsed.nameSpace,
        isBefore:false,
        isAfter:true,
      }
      return this._after._cascade(afterParsed);
    });
  }

  listeners(...args){
    return this._normal.listeners.apply(this._normal,args);
  }

  allListeners(...args){
    return [
      ...this._before.listeners.apply(this._before,args),
      ...this._normal.listeners.apply(this._normal,args),
      ...this._after.listeners.apply(this._after,args)
    ];
  }

  getNameSpaceListeners(...args){
    return this._normal.getNameSpaceListeners.apply(this._normal,args);
  }

  getAllNameSpaceListeners(...args){
    return [
      ...this._before.getNameSpaceListeners.apply(this._before,args),
      ...this._normal.getNameSpaceListeners.apply(this._normal,args),
      ...this._after.getNameSpaceListeners.apply(this._after,args)
    ];
  }

  removeNameSpaceListeners(...args){
    return this._normal.removeNameSpaceListeners.apply(this._normal,args);
  }

  removeAllNameSpaceListeners(...args){
    return this._normal.removeNameSpaceListeners.apply(this._normal,args)+
    this._before.removeNameSpaceListeners.apply(this._before,args)+
    this._after.removeNameSpaceListeners.apply(this._after,args);
  }

  wildcardMatchEventName(...args){
    return this._normal.wildcardMatchEventName.apply(this._normal,args);
  }

}

module.exports = Eventor;
