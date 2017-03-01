if(typeof jest=="undefined"){

  jest={
    fn:function(){
      let _test={
        test:function _test(){}
      }
      spyOn(_test,'test');
      return _test.test;
    }
  }
  global.jasmineRequire = {
      interface: function() {}
  };
  require("jasmine-promises");

}
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
    expect(eventor.wildcardMatchEventName("t*","test")).toBeTruthy();
    expect(eventor.wildcardMatchEventName("*est","test")).toBeTruthy();
    expect(eventor.wildcardMatchEventName("te*","test")).toBeTruthy();
    expect(eventor.wildcardMatchEventName("*st","test")).toBeTruthy();
    expect(eventor.wildcardMatchEventName("*","test")).toBeTruthy();

    expect(eventor.wildcardMatchEventName("t**","test")).toBeTruthy();
    expect(eventor.wildcardMatchEventName("**est","test")).toBeTruthy();
    expect(eventor.wildcardMatchEventName("te**","test")).toBeTruthy();
    expect(eventor.wildcardMatchEventName("**st","test")).toBeTruthy();
    expect(eventor.wildcardMatchEventName("**","test")).toBeTruthy();
    expect(eventor.wildcardMatchEventName(/t([a-z0-9]+)/i,"test")).toBeTruthy();

    expect(eventor.wildcardMatchEventName("o*.two.three.four","one.two.three.four")).toBeTruthy();
    expect(eventor.wildcardMatchEventName("o*.t*.three.four","one.two.three.four")).toBeTruthy();
    expect(eventor.wildcardMatchEventName("one.two.three.four","one.two.three.four")).toBeTruthy();
    expect(eventor.wildcardMatchEventName("one.*.three.four","one.two.three.four")).toBeTruthy();
    expect(eventor.wildcardMatchEventName("one.two.*three.four","one.two.three.four")).toBeTruthy();
    expect(eventor.wildcardMatchEventName("one.two*.three.four","one.two.three.four")).toBeTruthy();
    expect(eventor.wildcardMatchEventName("o**.two.three.four","one.two.three.four")).toBeTruthy();
    expect(eventor.wildcardMatchEventName("o**.two.three.four","one.five.six.seven.two.three.four")).toBeTruthy();
    expect(eventor.wildcardMatchEventName("one.two**","one.two.three.four")).toBeTruthy();
    expect(eventor.wildcardMatchEventName("one.two**","one.two")).toBeTruthy();
    expect(eventor.wildcardMatchEventName("o**.two.three.four","one.five.two.three.four")).toBeTruthy();
    expect(eventor.wildcardMatchEventName("o**.four","one.five.two.three.four")).toBeTruthy();
    expect(eventor.wildcardMatchEventName("o**our","one.five.two.three.four")).toBeTruthy();
    expect(eventor.wildcardMatchEventName("**our","one.five.two.three.four")).toBeTruthy();
    expect(eventor.wildcardMatchEventName("**.three.four","one.five.two.three.four")).toBeTruthy();
    expect(eventor.wildcardMatchEventName("**three.four","one.five.two.three.four")).toBeTruthy();

    expect(eventor.wildcardMatchEventName("o*.two.thr-ee.fo-ur","one.two.thr-ee.fo-ur")).toBeTruthy();
    expect(eventor.wildcardMatchEventName("o*.t*.thr//ee.fo\\ur","one.two.thr//ee.fo\\ur")).toBeTruthy();
    expect(eventor.wildcardMatchEventName("one.*.thr?.four","one.two.thr?.four")).toBeTruthy();
    expect(eventor.wildcardMatchEventName("one.two.*three.fo$ur","one.two.three.fo$ur")).toBeTruthy();
    expect(eventor.wildcardMatchEventName("one.two*.thr@ee.four","one.two.thr@ee.four")).toBeTruthy();
    expect(eventor.wildcardMatchEventName("o**.two.thrę.fourś","one.two.thrę.fourś")).toBeTruthy();

    expect(eventor.wildcardMatchEventName("o**.two.three.FOUR","one.five.six.seven.two.three.four")).toBeFalsy();
    expect(eventor.wildcardMatchEventName("one.Two**","one.two.three.four")).toBeFalsy();

    expect(eventor.wildcardMatchEventName("one.*.two**","one..two")).toBeTruthy();

    expect(eventor.wildcardMatchEventName("to*","test")).toBeFalsy();
    expect(eventor.wildcardMatchEventName("*ss","test")).toBeFalsy();
    expect(eventor.wildcardMatchEventName("o*","test")).toBeFalsy();
    expect(eventor.wildcardMatchEventName("*a","test")).toBeFalsy();
    expect(eventor.wildcardMatchEventName("*a","test")).toBeFalsy();

    expect(eventor.wildcardMatchEventName("o*.two.three.four","one.twooo.three.four")).toBeFalsy();
    expect(eventor.wildcardMatchEventName("one.two*three.four","one.two.three.four")).toBeFalsy();
    expect(eventor.wildcardMatchEventName("o*.t*.three.four","one.two.t.four")).toBeFalsy();
    expect(eventor.wildcardMatchEventName("one.two.three.*","one.two.three")).toBeFalsy();
    expect(eventor.wildcardMatchEventName("one.*.three*","one.two.three.four")).toBeFalsy();
    expect(eventor.wildcardMatchEventName("one.two*.three.four","one.atwo.three.four")).toBeFalsy();
    expect(eventor.wildcardMatchEventName("o**.two.three.four","one.two.five.three.four")).toBeFalsy();
    expect(eventor.wildcardMatchEventName("o**.two.three.four","bone.two.three.four")).toBeFalsy();
    expect(eventor.wildcardMatchEventName("one.two**","done.two.three.four")).toBeFalsy();
    expect(eventor.wildcardMatchEventName("one.two**","one.tw")).toBeFalsy();

    expect(eventor.wildcardMatchEventName(/test/gi,"test")).toBeTruthy();
    expect(eventor.wildcardMatchEventName(/^test$/gi,"test")).toBeTruthy();
    expect(eventor.wildcardMatchEventName(/te.*/gi,"test")).toBeTruthy();
    expect(eventor.wildcardMatchEventName(/.*st/gi,"test")).toBeTruthy();
  });

  it("should match -before eventNames with wildcard on emit/cascade",(done)=>{
    let eventor = new Eventor();
    let fn=jest.fn();
    eventor.useBefore("one.*.three",(data,event)=>{
      return new Promise((resolve)=>{
        fn();
        resolve("before");
      });
    });
    eventor.useBefore("one.two.**",(data,event)=>{
      return new Promise((resolve)=>{
        setTimeout(()=>{
          fn();
          resolve("before2");
        },100);
      });
    });
    eventor.on("*.two.three",(data,event)=>{
      return new Promise((resolve)=>{
        expect(data).toEqual("before2");
        fn();
        resolve("ok");
      });
    });
    eventor.emit("one.two.three",{}).then((results)=>{
      expect(fn).toHaveBeenCalledTimes(3);
      expect(results).toEqual(["ok"]);
      return eventor.cascade("one.two.three",{});
    }).then((result)=>{
      expect(fn).toHaveBeenCalledTimes(6);
      expect(result).toEqual("ok");
    });
    setTimeout(()=>{
      done();
    },200)
  });

  it("should match -after eventNames with wildcard on emit/cascade",()=>{
    let eventor = new Eventor();
    let fn=jest.fn();
    eventor.useAfter("one.*.three",(data,event)=>{
      return new Promise((resolve)=>{
        fn();
        resolve("after1");
      });
    });
    eventor.useAfter("one.two.**",(data,event)=>{
      return new Promise((resolve)=>{
        fn();
        resolve("after2");
      });
    });
    eventor.on("*.two.three",(data,event)=>{
      return new Promise((resolve)=>{
        expect(data).toEqual("go!");
        fn();
        resolve("ok");
      });
    });
    return eventor.emit("one.two.three","go!").then((results)=>{
      expect(fn).toHaveBeenCalledTimes(3);
      expect(results).toEqual(["after2"]);
      return eventor.cascade("one.two.three","go!");
    }).then((result)=>{
      expect(fn).toHaveBeenCalledTimes(6);
      expect(result).toEqual("after2");
    });
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
    eventor.on("t**",(data,event)=>{
      return new Promise((resolve)=>{
        // event.eventName can be an -before and -after event too
        resolve("t*");
      });
    });
    let allListeners = eventor.allListeners();
    expect(allListeners.length).toEqual(2);
    let wildcarded = allListeners.filter((listener)=>listener.isWildcard);
    expect(wildcarded.length).toEqual(2);
    let listeners = eventor.listeners("test");
    expect(listeners.length).toEqual(2);
    return eventor.cascade("test",{some:"data"}).then((result)=>{
      expect(result).toEqual("t*");
    }).catch((e)=>{throw e;});
  });

  it("should contain matched regex groups in event object",()=>{
    let eventor = new Eventor();
    eventor.useBefore(/t([a-z0-9]+)/i,(data,event)=>{
      return new Promise((resolve)=>{
        expect(Array.isArray(event.matches)).toEqual(true);
        expect(event.matches[1]).toEqual("est");
        resolve(data+1);
      });
    });
    eventor.on(/te([a-z0-9]+)/i,(data,event)=>{
      return new Promise((resolve)=>{
        expect(Array.isArray(event.matches)).toEqual(true);
        expect(event.matches[1]).toEqual("st");
        resolve(data+1);
      });
    });
    eventor.useAfter(/tes([a-z0-9]+)/i,(data,event)=>{
      return new Promise((resolve)=>{
        expect(Array.isArray(event.matches)).toEqual(true);
        expect(event.matches[1]).toEqual("t");
        resolve(data+1);
      });
    });
    eventor.useAfter(/te([a-z0-9]+)t/i,(data,event)=>{
      return new Promise((resolve)=>{
        expect(Array.isArray(event.matches)).toEqual(true);
        expect(event.matches[1]).toEqual("s");
        resolve(data);
      });
    });
    eventor.useAfterAll(/t([a-z0-9]+)/i,(data,event)=>{
      return new Promise((resolve)=>{
        expect(Array.isArray(event.matches)).toEqual(true);
        setTimeout(()=>{
          expect(event.matches[1]).toEqual("est");
        },50);
        expect(event.matches[1]).toEqual("est");
        if(event.type=="emit"){
            data=data.map((item)=>{
              return ++item;
            });
            resolve(data);
        }else{
          resolve(data+1);
        }
      });
    });
    eventor.useAfterAll(/te([a-z0-9]+)/i,(data,event)=>{
      return new Promise((resolve)=>{
        expect(Array.isArray(event.matches)).toEqual(true);
        expect(event.matches[1]).toEqual("st");
        if(event.type=="emit"){
            data=data.map((item)=>{
              return ++item;
            });
            resolve(data);
        }else{
          resolve(data+1);
        }
      });
    });
    eventor.useAfterAll(/t([a-z0-9]+)st/i,(data,event)=>{
      return new Promise((resolve)=>{
        expect(Array.isArray(event.matches)).toEqual(true);
        expect(event.matches[1]).toEqual("e");
        if(event.type=="emit"){
            data=data.map((item)=>{
              return ++item;
            });
            resolve(data);
        }else{
          resolve(data+1);
        }
      });
    });
    let all=eventor.allListeners();
    expect(all.length).toEqual(7);
    let test = eventor.allListeners("test");
    expect(test.length).toEqual(7);
    return eventor.cascade("test",0).then((result)=>{
      expect(result).toEqual(6);
      return eventor.emit("test",0);
    }).then((results)=>{
      expect(results).toEqual([6])
    });
  });

  it("should emit event when wildcard asterisk is in the middle of eventname",()=>{
    let eventor =  new Eventor();
    let fn = jest.fn();
    eventor.on("t*t",(data,event)=>{
      return new Promise((resolve)=>{
        // event.eventName can be an -before and -after event too
        resolve("t*t");
      });
    });
    eventor.on("t**t",(data,event)=>{
      return new Promise((resolve)=>{
        // event.eventName can be an -before and -after event too
        resolve("t*t");
      });
    });
    let allListeners = eventor.allListeners();
    expect(allListeners.length).toEqual(2);
    let wildcarded = allListeners.filter((listener)=>listener.isWildcard);
    expect(wildcarded.length).toEqual(2);
    let listeners = eventor.listeners("test");
    expect(listeners.length).toEqual(2);
    return eventor.cascade("test",{some:"data"}).then((result)=>{
      expect(result).toEqual("t*t");
    }).catch((e)=>{throw e;});
  });

  it("should emit an event when wildcard is in the beginning of the eventname",()=>{
    let eventor =  new Eventor();
    let fn = jest.fn();
    eventor.on("*t",(data,event)=>{
      return new Promise((resolve)=>{
        // event.eventName can be an -before and -after event too
        resolve("*t");
      });
    });
    eventor.on("**t",(data,event)=>{
      return new Promise((resolve)=>{
        // event.eventName can be an -before and -after event too
        resolve("*t");
      });
    });
    let allListeners = eventor.allListeners();
    expect(allListeners.length).toEqual(2);
    let wildcarded = allListeners.filter((listener)=>listener.isWildcard);
    expect(wildcarded.length).toEqual(2);
    let listeners = eventor.listeners("test");
    expect(listeners.length).toEqual(2);
    return eventor.cascade("test",{some:"data"}).then((result)=>{
      expect(result).toEqual("*t");
    }).catch((e)=>{throw e;});
  });

  it("should change event.eventName in callback to emitted eventName when wildcard match",()=>{
    let eventor = new Eventor();
    let fn = jest.fn();
    eventor.useBefore("one.**",(data,event)=>{
      return new Promise((resolve)=>{
        expect(event.eventName).toEqual("one.two.three");
        fn();
        resolve("test-before");
      })
    });
    eventor.on("one.**",(data,event)=>{
      return new Promise((resolve)=>{
        expect(event.eventName).toEqual("one.two.three");
        fn();
        resolve("test");
      })
    });
    eventor.useAfter("one.**",(data,event)=>{
      return new Promise((resolve)=>{
        expect(event.eventName).toEqual("one.two.three");
        fn();
        resolve("test-after");
      })
    });
    return eventor.emit("one.two.three",{}).then((results)=>{
      expect(fn).toHaveBeenCalledTimes(3);
      expect(results).toEqual(["test-after"]);
    });
  });

  it("should call wildcarded listeners in proper order",(done)=>{
    let eventor = new Eventor();
    eventor.useBefore("one**",(data,event)=>{
      return new Promise((resolve)=>{
        if(data!="go" && data!="go:first:second:fourth")
          done.fail("data should not equal "+data);
        resolve(data+":first");
      });
    });
    eventor.on("one.two.**",(data,event)=>{
      return new Promise((resolve)=>{
        expect(data).toEqual("go:first");
        resolve(data+":second");
      });
    });
    eventor.on("one.**",(data,event)=>{
      return new Promise((resolve)=>{
        resolve(data+":third");
      });
    });
    eventor.useAfter("one.*.*",(data,event)=>{
      return new Promise((resolve)=>{
        resolve(data+":fourth");
      });
    });
    return eventor.cascade("one.two.three","go").then((result)=>{
      expect(result).toEqual("go:first:second:fourth:first:third:fourth");
      return eventor.emit("one.two.three","go");
    }).then((results)=>{
      expect(results).toEqual(["go:first:second:fourth","go:first:third:fourth"]);
      done();
    });
  });

  it("should create and get namespaced middlewares with wildcards",()=>{
    let eventor = new Eventor();
    eventor.useBefore("module","t*",(data,event)=>{
      return new Promise((resolve)=>{
        expect(event.listener.nameSpace).toEqual("module");
        resolve(data+1);
      });
    });
    eventor.on("module","t*",(data,event)=>{
      return new Promise((resolve)=>{
        expect(event.listener.nameSpace).toEqual("module");
        resolve(data+1);
      });
    });
    eventor.useAfter("module","t*",(data,event)=>{
      return new Promise((resolve)=>{
        expect(event.listener.nameSpace).toEqual("module");
        resolve(data+1);
      });
    });
    expect(eventor.listeners().length).toEqual(1);
    expect(eventor.listeners("test").length).toEqual(1);
    expect(eventor.allListeners().length).toEqual(3);
    expect(eventor.allListeners("test").length).toEqual(3);
    let all = eventor.allListeners();
    all.forEach((listener)=>{
      expect(listener.nameSpace).toEqual("module");
    });

    expect(eventor.getNameSpaceListeners("module").length).toEqual(1);
    expect(eventor.getAllNameSpaceListeners("module").length).toEqual(3);
    return eventor.cascade("test",0).then((result)=>{
      expect(result).toEqual(3);
    });
  });

  it("should call to one namespace only",()=>{
    let eventor = new Eventor();
    let fn = jest.fn();
    eventor.useBefore("module","t*",(data,event)=>{
      return new Promise((resolve)=>{
        expect(event.listener.nameSpace).toEqual("module");
        fn();
        resolve(data+1);
      });
    });
    eventor.on("module","t*",(data,event)=>{
      return new Promise((resolve)=>{
        expect(event.listener.nameSpace).toEqual("module");
        fn();
        resolve(data+1);
      });
    });
    eventor.useAfter("module","t*",(data,event)=>{
      return new Promise((resolve)=>{
        expect(event.listener.nameSpace).toEqual("module");
        fn();
        resolve(data+1);
      });
    });

    eventor.useBefore("module2","t*",(data,event)=>{
      return new Promise((resolve)=>{
        expect(event.listener.nameSpace).toEqual("module2");
        fn();
        resolve(data+1);
      });
    });
    eventor.on("module2","t*",(data,event)=>{
      return new Promise((resolve)=>{
        expect(event.listener.nameSpace).toEqual("module2");
        fn();
        resolve(data+1);
      });
    });
    eventor.useAfter("module2","t*",(data,event)=>{
      return new Promise((resolve)=>{
        expect(event.listener.nameSpace).toEqual("module2");
        fn();
        resolve(data+1);
      });
    });
    expect(eventor.listeners().length).toEqual(2);
    expect(eventor.listeners("test").length).toEqual(2);
    expect(eventor.allListeners().length).toEqual(6);
    expect(eventor.allListeners("test").length).toEqual(6);
    let all = eventor.allListeners();

    expect(eventor.getNameSpaceListeners("module2").length).toEqual(1);
    expect(eventor.getAllNameSpaceListeners("module2").length).toEqual(3);
    return eventor.cascade("test",0).then((result)=>{
      expect(result).toEqual(10);
      expect(fn).toHaveBeenCalledTimes(10);
      return eventor.cascade("module2","test",0);
    }).then((result)=>{
      expect(result).toEqual(3);
      expect(fn).toHaveBeenCalledTimes(13);
    });
  });

});
