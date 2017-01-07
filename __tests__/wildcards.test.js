const Eventor = require("../index.js");
const jsc=require("jscheck");


let valueSize = 50;


let eventNames = [];
for(let i = 0;i<valueSize;i++){
  let name=jsc.string(jsc.integer(1,100),jsc.character())();
  if(eventNames.indexOf(name)>=0){
    i--;
  }else{
    eventNames.push(name);
  }
}

let values = jsc.array(valueSize,jsc.any())();

describe("wildcards",()=>{

  it("should match wildcards with event names",()=>{
    const eventor = new Eventor();
    expect(eventor.wildcardMatchEventName("t*","test")).toEqual(true);
    expect(eventor.wildcardMatchEventName("*est","test")).toEqual(true);
    expect(eventor.wildcardMatchEventName("te*","test")).toEqual(true);
    expect(eventor.wildcardMatchEventName("*st","test")).toEqual(true);
    expect(eventor.wildcardMatchEventName("*","test")).toEqual(true);

    expect(eventor.wildcardMatchEventName("t**","test")).toEqual(true);
    expect(eventor.wildcardMatchEventName("**est","test")).toEqual(true);
    expect(eventor.wildcardMatchEventName("te**","test")).toEqual(true);
    expect(eventor.wildcardMatchEventName("**st","test")).toEqual(true);
    expect(eventor.wildcardMatchEventName("**","test")).toEqual(true);

    expect(eventor.wildcardMatchEventName("o*.two.three.four","one.two.three.four")).toEqual(true);
    expect(eventor.wildcardMatchEventName("o*.t*.three.four","one.two.three.four")).toEqual(true);
    expect(eventor.wildcardMatchEventName("one.two.three.four","one.two.three.four")).toEqual(true);
    expect(eventor.wildcardMatchEventName("one.*.three.four","one.two.three.four")).toEqual(true);
    expect(eventor.wildcardMatchEventName("one.two.*three.four","one.two.three.four")).toEqual(true);
    expect(eventor.wildcardMatchEventName("one.two*.three.four","one.two.three.four")).toEqual(true);
    expect(eventor.wildcardMatchEventName("o**.two.three.four","one.two.three.four")).toEqual(true);
    expect(eventor.wildcardMatchEventName("o**.two.three.four","one.five.six.seven.two.three.four")).toEqual(true);
    expect(eventor.wildcardMatchEventName("one.two**","one.two.three.four")).toEqual(true);
    expect(eventor.wildcardMatchEventName("one.two**","one.two")).toEqual(true);
    expect(eventor.wildcardMatchEventName("o**.two.three.four","one.five.two.three.four")).toEqual(true);
    expect(eventor.wildcardMatchEventName("o**.four","one.five.two.three.four")).toEqual(true);
    expect(eventor.wildcardMatchEventName("o**our","one.five.two.three.four")).toEqual(true);
    expect(eventor.wildcardMatchEventName("**our","one.five.two.three.four")).toEqual(true);
    expect(eventor.wildcardMatchEventName("**.three.four","one.five.two.three.four")).toEqual(true);
    expect(eventor.wildcardMatchEventName("**three.four","one.five.two.three.four")).toEqual(true);

    expect(eventor.wildcardMatchEventName("to*","test")).toEqual(false);
    expect(eventor.wildcardMatchEventName("*ss","test")).toEqual(false);
    expect(eventor.wildcardMatchEventName("o*","test")).toEqual(false);
    expect(eventor.wildcardMatchEventName("*a","test")).toEqual(false);
    expect(eventor.wildcardMatchEventName("*a","test")).toEqual(false);

    expect(eventor.wildcardMatchEventName("o*.two.three.four","one.twooo.three.four")).toEqual(false);
    expect(eventor.wildcardMatchEventName("one.two*three.four","one.two.three.four")).toEqual(false);
    expect(eventor.wildcardMatchEventName("o*.t*.three.four","one.two.t.four")).toEqual(false);
    expect(eventor.wildcardMatchEventName("one.two.three.*","one.two.three")).toEqual(false);
    expect(eventor.wildcardMatchEventName("one.*.three*","one.two.three.four")).toEqual(false);
    expect(eventor.wildcardMatchEventName("one.two*.three.four","one.atwo.three.four")).toEqual(false);
    expect(eventor.wildcardMatchEventName("o**.two.three.four","one.two.five.three.four")).toEqual(false);
    expect(eventor.wildcardMatchEventName("o**.two.three.four","bone.two.three.four")).toEqual(false);
    expect(eventor.wildcardMatchEventName("one.two**","done.two.three.four")).toEqual(false);
    expect(eventor.wildcardMatchEventName("one.two**","one.tw")).toEqual(false);

    expect(eventor.wildcardMatchEventName(/test/gi,"test")).toEqual(true);
    expect(eventor.wildcardMatchEventName(/^test$/gi,"test")).toEqual(true);
    expect(eventor.wildcardMatchEventName(/te.*/gi,"test")).toEqual(true);
    expect(eventor.wildcardMatchEventName(/.*st/gi,"test")).toEqual(true);
  });

  it("should match -before and -after eventNames with wildcard",()=>{
    let eventor = new Eventor();
    //eventor.before()
  });

  it("should listen wildcarded events when asterisk is in the end of eventname",()=>{
    let eventor =  new Eventor();
    let fn = jest.fn();
    eventor.on("t*",(data,event)=>{
      return new Promise((resolve)=>{
        // event.eventName can be an -before and -after event too
        resolve("t*");
      });
    });
    let allListeners = eventor.allListeners();
    expect(allListeners.length).toEqual(1);
    let wildcarded = allListeners.filter((listener)=>listener.isWildcard);
    expect(wildcarded.length).toEqual(1);
    let listeners = eventor.listeners("test");
    expect(listeners.length).toEqual(1);
    return eventor.cascade("test",{some:"data"}).then((result)=>{
      expect(result).toEqual("t*");
    }).catch((e)=>{throw e;});
  });

  it("should contain matched regex groups in event object",()=>{
    // event.wildcardMatches? event.wildcard.groups?
  });

  it("should emit event when wildcard asterisk is in the middle of eventname",()=>{

  });

  it("should emit an event when wildcard is in the beginning of the eventname",()=>{

  });

  it("should change event.eventName in callback to emitted eventName when wildcard match",()=>{

  });

  it("should call listeners in proper order",()=>{

  });

  it("should emit t* event",()=>{

  });

  it("should create and get namespaced middlewares",()=>{

  });

});
